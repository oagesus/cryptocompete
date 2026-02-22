using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddCryptocurrencyUpdatedAtAndDeactivatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "deactivated_at",
                table: "cryptocurrencies",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "cryptocurrencies",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "deactivated_at",
                table: "cryptocurrencies");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "cryptocurrencies");
        }
    }
}
