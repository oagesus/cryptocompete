using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class RemovePayPalVaultedPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "paypal_vaulted_payments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "paypal_vaulted_payments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    pay_pal_customer_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    payer_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    payment_token_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_paypal_vaulted_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_paypal_vaulted_payments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_paypal_vaulted_payments_pay_pal_customer_id",
                table: "paypal_vaulted_payments",
                column: "pay_pal_customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_paypal_vaulted_payments_user_id_payment_token_id",
                table: "paypal_vaulted_payments",
                columns: new[] { "user_id", "payment_token_id" },
                unique: true);
        }
    }
}
