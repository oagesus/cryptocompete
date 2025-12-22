using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddLastActivitytoUserSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_activity_at",
                table: "user_sessions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<int>(
                name: "session_id",
                table: "refresh_tokens",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_session_id",
                table: "refresh_tokens",
                column: "session_id");

            migrationBuilder.AddForeignKey(
                name: "fk_refresh_tokens_user_sessions_session_id",
                table: "refresh_tokens",
                column: "session_id",
                principalTable: "user_sessions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_refresh_tokens_user_sessions_session_id",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "ix_refresh_tokens_session_id",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "last_activity_at",
                table: "user_sessions");

            migrationBuilder.DropColumn(
                name: "session_id",
                table: "refresh_tokens");
        }
    }
}
