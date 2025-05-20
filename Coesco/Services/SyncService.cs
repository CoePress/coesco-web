using System;
using System.IO;
using System.Collections.Generic;
using Npgsql;
using CsvHelper;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace CsvToPostgresImporter
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                Console.WriteLine("CSV to PostgreSQL Import Tool");
                Console.WriteLine("=============================");

                // Get database connection details
                string connectionString = GetConnectionString();

                // Get path to CSV files
                Console.Write("Enter the directory path containing CSV files: ");
                string csvDirectoryPath = Console.ReadLine().Trim();

                if (!Directory.Exists(csvDirectoryPath))
                {
                    Console.WriteLine($"Directory not found: {csvDirectoryPath}");
                    return;
                }

                // Process all CSV files in the directory
                string[] csvFiles = Directory.GetFiles(csvDirectoryPath, "*.csv");
                if (csvFiles.Length == 0)
                {
                    Console.WriteLine("No CSV files found in the specified directory.");
                    return;
                }

                Console.WriteLine($"Found {csvFiles.Length} CSV files.");

                foreach (string csvFile in csvFiles)
                {
                    try
                    {
                        string filename = Path.GetFileNameWithoutExtension(csvFile);
                        string tableName = filename.ToLower(); // Assume filename is the table name

                        Console.WriteLine($"\nProcessing {Path.GetFileName(csvFile)} into table '{tableName}'");

                        ImportCsvToTable(connectionString, csvFile, tableName);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error processing {csvFile}: {ex.Message}");
                        Console.WriteLine("Continuing with next file...");
                    }
                }

                Console.WriteLine("\nImport complete!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
            }

            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        static string GetConnectionString()
        {
            Console.Write("Enter the PostgreSQL server address (default: localhost): ");
            string server = Console.ReadLine().Trim();
            if (string.IsNullOrEmpty(server))
                server = "localhost";

            Console.Write("Enter the database name: ");
            string database = Console.ReadLine().Trim();

            Console.Write("Enter the username: ");
            string username = Console.ReadLine().Trim();

            Console.Write("Enter the password: ");
            string password = Console.ReadLine().Trim();

            Console.Write("Enter the port (default: 5432): ");
            string portInput = Console.ReadLine().Trim();
            int port = 5432;
            if (!string.IsNullOrEmpty(portInput))
            {
                if (!int.TryParse(portInput, out port))
                    port = 5432;
            }

            return $"Host={server};Port={port};Database={database};Username={username};Password={password}";
        }

        static void ImportCsvToTable(string connectionString, string csvFilePath, string tableName)
        {
            using (var connection = new NpgsqlConnection(connectionString))
            {
                connection.Open();

                // Get column information for the table
                var columns = GetTableColumns(connection, tableName);

                if (columns.Count == 0)
                {
                    Console.WriteLine($"Warning: No columns found for table '{tableName}' or table doesn't exist.");
                    return;
                }

                Console.WriteLine($"Detected {columns.Count} columns in table '{tableName}'");

                // Read and validate CSV headers
                using (var reader = new StreamReader(csvFilePath))
                using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
                {
                    csv.Read();
                    csv.ReadHeader();

                    var csvHeaders = csv.HeaderRecord.Select(h => h.ToLower()).ToList();
                    var tableColumns = columns.Keys.ToList();

                    Console.WriteLine($"CSV headers: {string.Join(", ", csvHeaders)}");
                    Console.WriteLine($"Table columns: {string.Join(", ", tableColumns)}");

                    // Validate CSV headers against table columns
                    var validColumns = csvHeaders.Where(h => tableColumns.Contains(h)).ToList();
                    if (validColumns.Count == 0)
                    {
                        Console.WriteLine("Error: None of the CSV headers match table columns.");
                        return;
                    }

                    // Begin transaction
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            int batchSize = 1000;
                            int batchCount = 0;
                            int totalRows = 0;
                            List<object[]> batch = new List<object[]>();

                            // Create parameter placeholders for the query
                            string paramPlaceholders = string.Join(", ",
                                validColumns.Select((_, i) => $"@p{i}").ToArray());

                            // Prepare the insert statement
                            string insertSql = $"INSERT INTO {tableName} ({string.Join(", ", validColumns)}) " +
                                              $"VALUES ({paramPlaceholders})";

                            while (csv.Read())
                            {
                                var rowValues = new object[validColumns.Count];
                                for (int i = 0; i < validColumns.Count; i++)
                                {
                                    string columnName = validColumns[i];
                                    string columnType = columns[columnName];
                                    string rawValue = csv.GetField(columnName) ?? "";

                                    // Convert value based on column type
                                    object convertedValue = ConvertToType(rawValue, columnType);
                                    rowValues[i] = convertedValue;
                                }

                                // Add row to batch
                                batch.Add(rowValues);

                                // Process batch if it reaches the batch size
                                if (batch.Count >= batchSize)
                                {
                                    ProcessBatch(connection, insertSql, validColumns, batch);
                                    totalRows += batch.Count;
                                    batchCount++;
                                    Console.WriteLine($"Processed batch {batchCount} ({totalRows} rows so far)");
                                    batch.Clear();
                                }
                            }

                            // Process remaining batch
                            if (batch.Count > 0)
                            {
                                ProcessBatch(connection, insertSql, validColumns, batch);
                                totalRows += batch.Count;
                                batchCount++;
                                Console.WriteLine($"Processed final batch {batchCount} (Total: {totalRows} rows)");
                            }

                            transaction.Commit();
                            Console.WriteLine($"Successfully imported {totalRows} rows into table '{tableName}'");
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine($"Transaction rolled back due to error: {ex.Message}");
                            throw;
                        }
                    }
                }
            }
        }

        static void ProcessBatch(NpgsqlConnection connection, string insertSql,
                                 List<string> columns, List<object[]> batch)
        {
            using (var cmd = new NpgsqlCommand(insertSql, connection))
            {
                foreach (var row in batch)
                {
                    for (int i = 0; i < columns.Count; i++)
                    {
                        cmd.Parameters.AddWithValue($"p{i}", row[i] ?? DBNull.Value);
                    }

                    cmd.ExecuteNonQuery();
                    cmd.Parameters.Clear();
                }
            }
        }

        static Dictionary<string, string> GetTableColumns(NpgsqlConnection connection, string tableName)
        {
            var columns = new Dictionary<string, string>();

            string sql = @"
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = @tableName 
                ORDER BY ordinal_position";

            using (var cmd = new NpgsqlCommand(sql, connection))
            {
                cmd.Parameters.AddWithValue("tableName", tableName);

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string columnName = reader.GetString(0).ToLower();
                        string dataType = reader.GetString(1).ToLower();
                        columns[columnName] = dataType;
                    }
                }
            }

            return columns;
        }

        static object ConvertToType(string value, string type)
        {
            if (string.IsNullOrEmpty(value))
                return null;

            try
            {
                switch (type)
                {
                    case "integer":
                    case "int":
                        return int.Parse(value);

                    case "numeric":
                    case "decimal":
                    case "double precision":
                    case "real":
                        return decimal.Parse(value, CultureInfo.InvariantCulture);

                    case "boolean":
                        value = value.ToLower();
                        if (value == "yes" || value == "true" || value == "1" || value == "t")
                            return true;
                        else if (value == "no" || value == "false" || value == "0" || value == "f")
                            return false;
                        else
                            return bool.Parse(value);

                    case "date":
                        return DateTime.Parse(value);

                    default:
                        return value;
                }
            }
            catch
            {
                Console.WriteLine($"Warning: Could not convert '{value}' to {type}, using NULL instead");
                return null;
            }
        }
    }
}