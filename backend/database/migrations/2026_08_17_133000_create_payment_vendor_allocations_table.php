<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_vendor_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignUuid('payment_attempt_id')->nullable()->constrained('payment_attempts')->nullOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->cascadeOnDelete();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->string('vendor_name', 255);
            $table->decimal('vendor_subtotal', 12, 2);
            $table->decimal('shipping_cost', 12, 2);
            $table->decimal('assembly_cost', 12, 2);
            $table->decimal('discount_amount', 12, 2);
            $table->decimal('vat_amount', 12, 2);
            $table->decimal('vendor_gross_total', 12, 2);
            $table->decimal('platform_commission_amount', 12, 2)->default(0);
            $table->decimal('vendor_payable_amount', 12, 2);
            $table->string('currency', 3);
            $table->timestamps();

            $table->unique(['payment_id', 'vendor_order_id']);
        });

        Schema::table('payment_attempts', function (Blueprint $table) {
            $table->string('gateway_payment_url', 512)->nullable()->after('gateway_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('payment_attempts', function (Blueprint $table) {
            $table->dropColumn('gateway_payment_url');
        });

        Schema::dropIfExists('payment_vendor_allocations');
    }
};
