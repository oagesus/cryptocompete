using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPercentChangeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "percent_change30d",
                table: "cryptocurrencies",
                type: "numeric(18,8)",
                precision: 18,
                scale: 8,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "percent_change60d",
                table: "cryptocurrencies",
                type: "numeric(18,8)",
                precision: 18,
                scale: 8,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "percent_change7d",
                table: "cryptocurrencies",
                type: "numeric(18,8)",
                precision: 18,
                scale: 8,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "percent_change90d",
                table: "cryptocurrencies",
                type: "numeric(18,8)",
                precision: 18,
                scale: 8,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "percent_change30d",
                table: "cryptocurrencies");

            migrationBuilder.DropColumn(
                name: "percent_change60d",
                table: "cryptocurrencies");

            migrationBuilder.DropColumn(
                name: "percent_change7d",
                table: "cryptocurrencies");

            migrationBuilder.DropColumn(
                name: "percent_change90d",
                table: "cryptocurrencies");
        }
    }
}
