using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Coesco.Migrations
{
    /// <inheritdoc />
    public partial class SnakeCaseInitial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Users",
                table: "Users");

            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "users",
                newSchema: "public");

            migrationBuilder.RenameColumn(
                name: "Username",
                schema: "public",
                table: "users",
                newName: "username");

            migrationBuilder.RenameColumn(
                name: "Email",
                schema: "public",
                table: "users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "public",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                schema: "public",
                table: "users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "LastLoginAt",
                schema: "public",
                table: "users",
                newName: "last_login_at");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                schema: "public",
                table: "users",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                schema: "public",
                table: "users",
                newName: "created_at");

            migrationBuilder.AddPrimaryKey(
                name: "pk_users",
                schema: "public",
                table: "users",
                column: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_users",
                schema: "public",
                table: "users");

            migrationBuilder.RenameTable(
                name: "users",
                schema: "public",
                newName: "Users");

            migrationBuilder.RenameColumn(
                name: "username",
                table: "Users",
                newName: "Username");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "last_login_at",
                table: "Users",
                newName: "LastLoginAt");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Users",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "Id");
        }
    }
}
