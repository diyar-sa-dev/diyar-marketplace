<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('referral_code', 32)->unique();
            $table->string('status', 24)->default('active');
            $table->string('display_name')->nullable();
            $table->string('payout_account_holder')->nullable();
            $table->string('payout_iban', 34)->nullable();
            $table->string('payout_bank_code', 24)->nullable();
            $table->string('payout_bank_name')->nullable();
            $table->json('social_links')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'affiliate_profiles_status_created_idx');
        });

        Schema::create('product_affiliate_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->unique()->constrained('products')->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->decimal('commission_min_percent', 5, 2);
            $table->decimal('commission_max_percent', 5, 2);
            $table->decimal('commission_rate_percent', 5, 2);
            $table->timestamps();
        });

        Schema::create('affiliate_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name');
            $table->string('referral_code', 32)->unique();
            $table->decimal('commission_rate_percent', 5, 2);
            $table->boolean('is_active')->default(true);
            $table->string('campaign_name')->nullable();
            $table->string('source')->nullable();
            $table->unsignedBigInteger('click_count')->default(0);
            $table->unsignedBigInteger('conversion_count')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'is_active', 'created_at'], 'affiliate_links_profile_active_idx');
            $table->index(['product_id', 'is_active'], 'affiliate_links_product_active_idx');
        });

        Schema::create('affiliate_clicks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_link_id')->constrained('affiliate_links')->cascadeOnDelete();
            $table->foreignUuid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('session_fingerprint', 64);
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'created_at'], 'affiliate_clicks_profile_created_idx');
            $table->index(['affiliate_link_id', 'created_at'], 'affiliate_clicks_link_created_idx');
            $table->index(['product_id', 'created_at'], 'affiliate_clicks_product_created_idx');
            $table->index(['session_fingerprint', 'affiliate_link_id', 'created_at'], 'affiliate_clicks_dedupe_idx');
        });

        Schema::create('affiliate_attributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignUuid('affiliate_link_id')->constrained('affiliate_links')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_fingerprint', 64);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['session_fingerprint', 'product_id', 'expires_at'], 'affiliate_attr_session_product_exp_idx');
            $table->index(['user_id', 'product_id', 'expires_at'], 'affiliate_attr_user_product_exp_idx');
        });

        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignUuid('affiliate_link_id')->nullable()->constrained('affiliate_links')->nullOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('status', 24);
            $table->decimal('commission_rate_percent', 5, 2);
            $table->decimal('commission_base_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('idempotency_key', 128)->unique();
            $table->timestamp('available_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->foreignUuid('affiliate_payout_id')->nullable();
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'status', 'created_at'], 'affiliate_comm_profile_status_idx');
            $table->index(['order_id'], 'affiliate_comm_order_idx');
            $table->index(['order_item_id'], 'affiliate_comm_order_item_idx');
        });

        Schema::create('affiliate_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 64)->unique();
            $table->foreignUuid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('status', 24);
            $table->timestamp('requested_at');
            $table->timestamp('processed_at')->nullable();
            $table->foreignUuid('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->string('idempotency_key', 128)->nullable()->unique();
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'status', 'requested_at'], 'affiliate_payouts_profile_status_idx');
        });

        Schema::table('affiliate_commissions', function (Blueprint $table) {
            $table->foreign('affiliate_payout_id')
                ->references('id')
                ->on('affiliate_payouts')
                ->nullOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignUuid('affiliate_profile_id')->nullable()->after('color_hex')->constrained('affiliate_profiles')->nullOnDelete();
            $table->foreignUuid('affiliate_link_id')->nullable()->after('affiliate_profile_id')->constrained('affiliate_links')->nullOnDelete();
            $table->decimal('affiliate_commission_rate', 5, 2)->nullable()->after('affiliate_link_id');
            $table->decimal('affiliate_commission_base', 12, 2)->nullable()->after('affiliate_commission_rate');
            $table->decimal('affiliate_commission_amount', 12, 2)->nullable()->after('affiliate_commission_base');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('affiliate_link_id');
            $table->dropConstrainedForeignId('affiliate_profile_id');
            $table->dropColumn([
                'affiliate_commission_rate',
                'affiliate_commission_base',
                'affiliate_commission_amount',
            ]);
        });

        Schema::dropIfExists('affiliate_commissions');
        Schema::dropIfExists('affiliate_payouts');
        Schema::dropIfExists('affiliate_attributions');
        Schema::dropIfExists('affiliate_clicks');
        Schema::dropIfExists('affiliate_links');
        Schema::dropIfExists('product_affiliate_settings');
        Schema::dropIfExists('affiliate_profiles');
    }
};
