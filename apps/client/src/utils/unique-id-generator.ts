import { instance } from "@/utils";

/**
 * Generates a unique ID for a given table by checking against existing records
 * @param tableName - The name of the database table
 * @param idFieldName - The name of the ID field in the table
 * @param database - The database name (defaults to "std")
 * @returns Promise<string> - A unique ID for the table
 */
export async function generateUniqueId(
  tableName: string,
  idFieldName: string,
  database: string = "std"
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const newId = crypto.randomUUID();
    
    try {
      // Check if this ID already exists in the table using the API instance
      const response = await instance.get(
        `/legacy/${database}/${tableName}/filter/custom`,
        { 
          params: { [idFieldName]: newId }
        }
      );

      const existingRecords = response.data;
      
      // If no records found with this ID, it's unique
      if (!existingRecords || !Array.isArray(existingRecords) || existingRecords.length === 0) {
        return newId;
      }
    } catch (error: any) {
      // If error status is 404 or similar "not found" error, ID is unique
      if (error.response?.status === 404 || error.response?.data === null) {
        return newId;
      }
      
      console.error("Error checking ID uniqueness:", error);
      // If there's an unexpected error, assume it's unique and return
      return newId;
    }

    attempts++;
  }

  // If we somehow can't generate a unique ID after maxAttempts, throw an error
  throw new Error(`Failed to generate unique ID for table ${tableName} after ${maxAttempts} attempts`);
}

/**
 * Generates a unique numeric ID for tables that use integer IDs
 * @param tableName - The name of the database table
 * @param idFieldName - The name of the ID field in the table
 * @param database - The database name (defaults to "std")
 * @returns Promise<number> - A unique numeric ID for the table
 */
export async function generateUniqueNumericId(
  tableName: string,
  idFieldName: string,
  database: string = "std"
): Promise<number> {
  try {
    // Get the maximum existing ID using the API instance
    const response = await instance.get(
      `/legacy/${database}/${tableName}/${idFieldName}/max`
    );

    const result = response.data;
    const maxValue = result?.maxValue || 0;
    return maxValue + 1;
  } catch (error: any) {
    console.error("Error getting max ID:", error);
    // Fallback to random number if max lookup fails
    return Math.floor(Math.random() * 1000000) + 1;
  }
}