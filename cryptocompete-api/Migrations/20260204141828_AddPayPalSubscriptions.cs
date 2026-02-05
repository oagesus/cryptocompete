using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPayPalSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pay_pal_subscriptions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    pay_pal_subscription_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    pay_pal_plan_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    current_period_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    current_period_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pay_pal_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_pay_pal_subscriptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pay_pal_vaulted_payments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    pay_pal_customer_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    payment_token_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    payer_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pay_pal_vaulted_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_pay_pal_vaulted_payments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscription_payments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    subscription_id = table.Column<int>(type: "integer", nullable: true),
                    pay_pal_capture_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscription_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscription_payments_pay_pal_subscriptions_subscription_id",
                        column: x => x.subscription_id,
                        principalTable: "pay_pal_subscriptions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_subscription_payments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_pay_pal_subscriptions_pay_pal_subscription_id",
                table: "pay_pal_subscriptions",
                column: "pay_pal_subscription_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pay_pal_subscriptions_user_id",
                table: "pay_pal_subscriptions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_pay_pal_vaulted_payments_pay_pal_customer_id",
                table: "pay_pal_vaulted_payments",
                column: "pay_pal_customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_pay_pal_vaulted_payments_user_id_payment_token_id",
                table: "pay_pal_vaulted_payments",
                columns: new[] { "user_id", "payment_token_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_pay_pal_capture_id",
                table: "subscription_payments",
                column: "pay_pal_capture_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_subscription_id",
                table: "subscription_payments",
                column: "subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_user_id",
                table: "subscription_payments",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pay_pal_vaulted_payments");

            migrationBuilder.DropTable(
                name: "subscription_payments");

            migrationBuilder.DropTable(
                name: "pay_pal_subscriptions");
        }
    }
}
