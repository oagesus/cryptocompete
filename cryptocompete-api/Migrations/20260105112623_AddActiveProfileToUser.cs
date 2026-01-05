using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveProfileToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "active_profile_id",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_active_profile_id",
                table: "users",
                column: "active_profile_id");

            migrationBuilder.AddForeignKey(
                name: "fk_users_profiles_active_profile_id",
                table: "users",
                column: "active_profile_id",
                principalTable: "profiles",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_users_profiles_active_profile_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_active_profile_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "active_profile_id",
                table: "users");
        }
    }
}
