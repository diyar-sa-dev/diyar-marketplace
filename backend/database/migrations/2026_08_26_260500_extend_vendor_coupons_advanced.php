<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_coupons', function (Blueprint $table) {
            $table->string('scope_type', 32)->default('all')->after('type');
            $table->boolean('stackable')->default(false)->after('scope_type');
            $table->string('exclusive_group', 64)->nullable()->after('stackable');
            $table->unsignedInteger('usage_limit_per_user')->nullable()->after('usage_limit');
            $table->decimal('fixed_amount', 12, 2)->nullable()->after('value');
        });

        Schema::create('vendor_coupon_scopes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_coupon_id')->constrained('vendor_coupons')->cascadeOnDelete();
            $table->string('scope_type', 32);
            $table->uuid('scope_id');
            $table->timestamps();

            $table->unique(['vendor_coupon_id', 'scope_type', 'scope_id'], 'vendor_coupon_scopes_unique');
            $table->index(['scope_type', 'scope_id']);
        });

        Schema::create('vendor_coupon_exclusions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_coupon_id')->constrained('vendor_coupons')->cascadeOnDelete();
            $table->string('exclusion_type', 32);
            $table->uuid('exclusion_id');
            $table->timestamps();

            $table->unique(['vendor_coupon_id', 'exclusion_type', 'exclusion_id'], 'vendor_coupon_exclusions_unique');
            $table->index(['exclusion_type', 'exclusion_id']);
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->decimal('coupon_discount_snapshot', 12, 2)->nullable()->after('coupon_percent_snapshot');
            $table->string('coupon_type_snapshot', 32)->nullable()->after('coupon_discount_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->dropColumn(['coupon_discount_snapshot', 'coupon_type_snapshot']);
        });

        Schema::dropIfExists('vendor_coupon_exclusions');
        Schema::dropIfExists('vendor_coupon_scopes');

        Schema::table('vendor_coupons', function (Blueprint $table) {
            $table->dropColumn([
                'scope_type',
                'stackable',
                'exclusive_group',
                'usage_limit_per_user',
                'fixed_amount',
            ]);
        });
    }
};
