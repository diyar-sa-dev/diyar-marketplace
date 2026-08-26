<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_carriers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 64)->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('carrier_id')->constrained('shipping_carriers')->cascadeOnDelete();
            $table->string('name');
            $table->string('country_code', 8)->nullable();
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_prefix', 16)->nullable();
            $table->unsignedSmallInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['carrier_id', 'is_active', 'priority']);
            $table->index(['country_code', 'city']);
        });

        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('carrier_id')->constrained('shipping_carriers')->cascadeOnDelete();
            $table->string('code', 64);
            $table->string('name');
            $table->string('method_type', 32)->default('weight_tier');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['carrier_id', 'code']);
            $table->index(['carrier_id', 'is_active']);
        });

        Schema::create('shipping_rate_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shipping_method_id')->constrained('shipping_methods')->cascadeOnDelete();
            $table->foreignUuid('zone_id')->nullable()->constrained('shipping_zones')->nullOnDelete();
            $table->foreignUuid('vendor_account_id')->nullable()->constrained('vendor_accounts')->cascadeOnDelete();
            $table->decimal('min_weight_kg', 10, 3)->default(0);
            $table->decimal('max_weight_kg', 10, 3)->nullable();
            $table->decimal('min_subtotal', 12, 2)->default(0);
            $table->decimal('max_subtotal', 12, 2)->nullable();
            $table->decimal('rate', 12, 2);
            $table->decimal('handling_fee', 12, 2)->default(0);
            $table->decimal('free_shipping_threshold', 12, 2)->nullable();
            $table->unsignedInteger('volumetric_divisor')->nullable();
            $table->unsignedSmallInteger('delivery_estimate_days')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['shipping_method_id', 'zone_id', 'is_active', 'sort_order'], 'shipping_rate_rules_lookup');
            $table->index(['vendor_account_id', 'is_active']);
        });

        Schema::create('vendor_shipping_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->foreignUuid('shipping_method_id')->nullable()->constrained('shipping_methods')->nullOnDelete();
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('volumetric_divisor')->nullable();
            $table->decimal('handling_fee', 12, 2)->default(0);
            $table->decimal('free_shipping_threshold', 12, 2)->nullable();
            $table->unsignedSmallInteger('delivery_estimate_days')->nullable();
            $table->timestamps();

            $table->index(['vendor_account_id', 'is_default', 'is_active'], 'vendor_ship_profiles_vendor_idx');
        });

        Schema::table('vendor_shipping_settings', function (Blueprint $table) {
            $table->boolean('use_advanced_rules')->default(false)->after('pickup_location_label');
            $table->foreignUuid('shipping_profile_id')->nullable()->after('use_advanced_rules')
                ->constrained('vendor_shipping_profiles')->nullOnDelete();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('weight_kg', 10, 3)->nullable()->after('depth');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('weight_kg');
        });

        Schema::table('vendor_shipping_settings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_profile_id');
            $table->dropColumn('use_advanced_rules');
        });

        Schema::dropIfExists('vendor_shipping_profiles');
        Schema::dropIfExists('shipping_rate_rules');
        Schema::dropIfExists('shipping_methods');
        Schema::dropIfExists('shipping_zones');
        Schema::dropIfExists('shipping_carriers');
    }
};
