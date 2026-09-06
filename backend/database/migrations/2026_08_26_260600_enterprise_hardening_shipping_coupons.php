<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->string('country_code', 8)->default('SA')->after('district');
            $table->string('postal_code', 16)->nullable()->after('country_code');
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->decimal('shipping_discount_amount', 12, 2)->default('0.00')->after('shipping_cost');
        });

        Schema::table('vendor_coupon_usages', function (Blueprint $table) {
            $table->index(['vendor_coupon_id', 'user_id'], 'coupon_usages_coupon_user_idx');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_coupon_usages', function (Blueprint $table) {
            $table->dropIndex('coupon_usages_coupon_user_idx');
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->dropColumn('shipping_discount_amount');
        });

        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn(['country_code', 'postal_code']);
        });
    }
};
