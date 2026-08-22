<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_clicks', function (Blueprint $table) {
            $table->string('traffic_source', 32)->nullable()->after('ip_hash');
            $table->string('referrer_url', 512)->nullable()->after('traffic_source');
            $table->timestamp('converted_at')->nullable()->after('referrer_url');
            $table->foreignUuid('affiliate_commission_id')->nullable()->after('converted_at');

            $table->index(['affiliate_profile_id', 'traffic_source', 'created_at'], 'affiliate_clicks_profile_source_idx');
            $table->index(['affiliate_link_id', 'converted_at'], 'affiliate_clicks_link_converted_idx');
        });

        Schema::table('affiliate_attributions', function (Blueprint $table) {
            $table->foreignUuid('affiliate_click_id')->nullable()->after('affiliate_link_id');
            $table->string('traffic_source', 32)->nullable()->after('affiliate_click_id');
        });

        Schema::table('affiliate_commissions', function (Blueprint $table) {
            $table->foreignUuid('affiliate_click_id')->nullable()->after('affiliate_link_id');
            $table->string('traffic_source', 32)->nullable()->after('affiliate_click_id');

            $table->index(['affiliate_profile_id', 'traffic_source', 'created_at'], 'affiliate_comm_profile_source_idx');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignUuid('affiliate_click_id')->nullable()->after('affiliate_link_id');
            $table->string('affiliate_traffic_source', 32)->nullable()->after('affiliate_click_id');
        });

        Schema::table('affiliate_clicks', function (Blueprint $table) {
            $table->foreign('affiliate_commission_id')
                ->references('id')
                ->on('affiliate_commissions')
                ->nullOnDelete();
        });

        Schema::table('affiliate_attributions', function (Blueprint $table) {
            $table->foreign('affiliate_click_id')
                ->references('id')
                ->on('affiliate_clicks')
                ->nullOnDelete();
        });

        Schema::table('affiliate_commissions', function (Blueprint $table) {
            $table->foreign('affiliate_click_id')
                ->references('id')
                ->on('affiliate_clicks')
                ->nullOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('affiliate_click_id')
                ->references('id')
                ->on('affiliate_clicks')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('affiliate_click_id');
            $table->dropColumn('affiliate_traffic_source');
        });

        Schema::table('affiliate_commissions', function (Blueprint $table) {
            $table->dropIndex('affiliate_comm_profile_source_idx');
            $table->dropConstrainedForeignId('affiliate_click_id');
            $table->dropColumn('traffic_source');
        });

        Schema::table('affiliate_attributions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('affiliate_click_id');
            $table->dropColumn('traffic_source');
        });

        Schema::table('affiliate_clicks', function (Blueprint $table) {
            $table->dropForeign(['affiliate_commission_id']);
            $table->dropIndex('affiliate_clicks_profile_source_idx');
            $table->dropIndex('affiliate_clicks_link_converted_idx');
            $table->dropColumn(['traffic_source', 'referrer_url', 'converted_at', 'affiliate_commission_id']);
        });
    }
};
