<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->string('code', 64);
            $table->string('type', 32)->default('percentage');
            $table->unsignedTinyInteger('value');
            $table->decimal('minimum_order', 12, 2)->default(0);
            $table->decimal('maximum_discount', 12, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['vendor_account_id', 'code']);
            $table->index(['vendor_account_id', 'is_active']);
            $table->index(['starts_at', 'ends_at']);
        });

        Schema::create('vendor_coupon_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_coupon_id')->constrained('vendor_coupons')->restrictOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->restrictOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->restrictOnDelete();
            $table->decimal('discount_amount', 12, 2);
            $table->string('coupon_code', 64);
            $table->unsignedTinyInteger('coupon_percent');
            $table->timestamp('used_at');
            $table->timestamps();

            $table->unique(['vendor_coupon_id', 'order_id']);
            $table->index(['vendor_coupon_id', 'used_at']);
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->foreignUuid('vendor_coupon_id')->nullable()->after('vendor_account_id')->constrained('vendor_coupons')->nullOnDelete();
            $table->string('coupon_code', 64)->nullable()->after('vendor_coupon_id');
            $table->unsignedTinyInteger('coupon_percent_snapshot')->nullable()->after('coupon_code');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_coupon_id');
            $table->dropColumn(['coupon_code', 'coupon_percent_snapshot']);
        });

        Schema::dropIfExists('vendor_coupon_usages');
        Schema::dropIfExists('vendor_coupons');
    }
};
