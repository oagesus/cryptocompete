using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace cryptocompete_api.Migrations
{
    /// <inheritdoc />
    public partial class RenamePayPalTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_subscription_payments_pay_pal_subscriptions_subscription_id",
                table: "subscription_payments");

            migrationBuilder.DropForeignKey(
                name: "fk_pay_pal_subscriptions_users_user_id",
                table: "pay_pal_subscriptions");

            migrationBuilder.DropForeignKey(
                name: "fk_pay_pal_vaulted_payments_users_user_id",
                table: "pay_pal_vaulted_payments");

            migrationBuilder.DropPrimaryKey(
                name: "pk_pay_pal_vaulted_payments",
                table: "pay_pal_vaulted_payments");

            migrationBuilder.DropPrimaryKey(
                name: "pk_pay_pal_subscriptions",
                table: "pay_pal_subscriptions");

            migrationBuilder.RenameTable(
                name: "pay_pal_vaulted_payments",
                newName: "paypal_vaulted_payments");

            migrationBuilder.RenameTable(
                name: "pay_pal_subscriptions",
                newName: "paypal_subscriptions");

            migrationBuilder.RenameIndex(
                name: "ix_pay_pal_vaulted_payments_user_id_payment_token_id",
                table: "paypal_vaulted_payments",
                newName: "ix_paypal_vaulted_payments_user_id_payment_token_id");

            migrationBuilder.RenameIndex(
                name: "ix_pay_pal_vaulted_payments_pay_pal_customer_id",
                table: "paypal_vaulted_payments",
                newName: "ix_paypal_vaulted_payments_pay_pal_customer_id");

            migrationBuilder.RenameIndex(
                name: "ix_pay_pal_subscriptions_user_id",
                table: "paypal_subscriptions",
                newName: "ix_paypal_subscriptions_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_pay_pal_subscriptions_pay_pal_subscription_id",
                table: "paypal_subscriptions",
                newName: "ix_paypal_subscriptions_pay_pal_subscription_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_paypal_vaulted_payments",
                table: "paypal_vaulted_payments",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_paypal_subscriptions",
                table: "paypal_subscriptions",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_paypal_subscriptions_users_user_id",
                table: "paypal_subscriptions",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_paypal_vaulted_payments_users_user_id",
                table: "paypal_vaulted_payments",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_subscription_payments_paypal_subscriptions_subscription_id",
                table: "subscription_payments",
                column: "subscription_id",
                principalTable: "paypal_subscriptions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_subscription_payments_paypal_subscriptions_subscription_id",
                table: "subscription_payments");

            migrationBuilder.DropForeignKey(
                name: "fk_paypal_subscriptions_users_user_id",
                table: "paypal_subscriptions");

            migrationBuilder.DropForeignKey(
                name: "fk_paypal_vaulted_payments_users_user_id",
                table: "paypal_vaulted_payments");

            migrationBuilder.DropPrimaryKey(
                name: "pk_paypal_vaulted_payments",
                table: "paypal_vaulted_payments");

            migrationBuilder.DropPrimaryKey(
                name: "pk_paypal_subscriptions",
                table: "paypal_subscriptions");

            migrationBuilder.RenameTable(
                name: "paypal_vaulted_payments",
                newName: "pay_pal_vaulted_payments");

            migrationBuilder.RenameTable(
                name: "paypal_subscriptions",
                newName: "pay_pal_subscriptions");

            migrationBuilder.RenameIndex(
                name: "ix_paypal_vaulted_payments_user_id_payment_token_id",
                table: "pay_pal_vaulted_payments",
                newName: "ix_pay_pal_vaulted_payments_user_id_payment_token_id");

            migrationBuilder.RenameIndex(
                name: "ix_paypal_vaulted_payments_pay_pal_customer_id",
                table: "pay_pal_vaulted_payments",
                newName: "ix_pay_pal_vaulted_payments_pay_pal_customer_id");

            migrationBuilder.RenameIndex(
                name: "ix_paypal_subscriptions_user_id",
                table: "pay_pal_subscriptions",
                newName: "ix_pay_pal_subscriptions_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_paypal_subscriptions_pay_pal_subscription_id",
                table: "pay_pal_subscriptions",
                newName: "ix_pay_pal_subscriptions_pay_pal_subscription_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_pay_pal_vaulted_payments",
                table: "pay_pal_vaulted_payments",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_pay_pal_subscriptions",
                table: "pay_pal_subscriptions",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_pay_pal_subscriptions_users_user_id",
                table: "pay_pal_subscriptions",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_pay_pal_vaulted_payments_users_user_id",
                table: "pay_pal_vaulted_payments",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_subscription_payments_pay_pal_subscriptions_subscription_id",
                table: "subscription_payments",
                column: "subscription_id",
                principalTable: "pay_pal_subscriptions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}