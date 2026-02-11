using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceAlarmPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "price_alarms",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.Sql(
                "UPDATE price_alarms SET public_id = gen_random_uuid()");

            migrationBuilder.CreateIndex(
                name: "ix_price_alarms_public_id",
                table: "price_alarms",
                column: "public_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_price_alarms_public_id",
                table: "price_alarms");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "price_alarms");
        }
    }
}