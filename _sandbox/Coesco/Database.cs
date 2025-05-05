using Coesco.Models.Domain;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Coesco
{
    public class Database : DbContext
    {
        public Database(DbContextOptions<Database> options) : base(options) { }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("public");

            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                entity.SetTableName(ToSnakeCase(entity.GetTableName()));

                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(ToSnakeCase(property.GetColumnName()));
                }

                foreach (var key in entity.GetKeys())
                {
                    key.SetName(ToSnakeCase(key.GetName()));
                }

                foreach (var key in entity.GetForeignKeys())
                {
                    key.SetConstraintName(ToSnakeCase(key.GetConstraintName()));
                }

                foreach (var index in entity.GetIndexes())
                {
                    index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()));
                }
            }
        }

        private string ToSnakeCase(string input)
        {
            if (input == null) return input;

            var startUnderscores = Regex.Match(input, @"^_+");
            return startUnderscores + Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1_$2").ToLower();
        }
    }
}