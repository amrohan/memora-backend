using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace memora_backend.Migrations
{
    /// <inheritdoc />
    public partial class userpref : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPreference_Users_UserId",
                table: "UserPreference");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPreference",
                table: "UserPreference");

            migrationBuilder.RenameTable(
                name: "UserPreference",
                newName: "UserPreferences");

            migrationBuilder.RenameIndex(
                name: "IX_UserPreference_UserId",
                table: "UserPreferences",
                newName: "IX_UserPreferences_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPreferences",
                table: "UserPreferences",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPreferences_Users_UserId",
                table: "UserPreferences",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPreferences_Users_UserId",
                table: "UserPreferences");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPreferences",
                table: "UserPreferences");

            migrationBuilder.RenameTable(
                name: "UserPreferences",
                newName: "UserPreference");

            migrationBuilder.RenameIndex(
                name: "IX_UserPreferences_UserId",
                table: "UserPreference",
                newName: "IX_UserPreference_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPreference",
                table: "UserPreference",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPreference_Users_UserId",
                table: "UserPreference",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
