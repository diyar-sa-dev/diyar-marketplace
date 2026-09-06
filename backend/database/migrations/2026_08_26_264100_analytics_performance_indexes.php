<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index('created_at', 'orders_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['status', 'paid_at'], 'payments_status_paid_at_index');
            $table->index('created_at', 'payments_created_at_index');
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->index(['vendor_account_id', 'status', 'updated_at'], 'vendor_orders_vendor_status_updated_index');
        });

        Schema::table('payment_vendor_allocations', function (Blueprint $table) {
            $table->index('vendor_account_id', 'payment_allocations_vendor_index');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->index('created_at', 'cart_items_created_at_index');
        });

        Schema::table('analytics_events', function (Blueprint $table) {
            $table->index(['provider_account_id', 'event_type', 'created_at'], 'analytics_provider_event_time');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_status_paid_at_index');
            $table->dropIndex('payments_created_at_index');
        });

        Schema::table('vendor_orders', function (Blueprint $table) {
            $table->dropIndex('vendor_orders_vendor_status_updated_index');
        });

        Schema::table('payment_vendor_allocations', function (Blueprint $table) {
            $table->dropIndex('payment_allocations_vendor_index');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex('cart_items_created_at_index');
        });

        Schema::table('analytics_events', function (Blueprint $table) {
            $table->dropIndex('analytics_provider_event_time');
        });
    }
};
