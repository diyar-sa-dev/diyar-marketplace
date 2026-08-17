<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_number_sequences', function (Blueprint $table) {
            $table->string('date', 8)->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('refund_number_sequences', function (Blueprint $table) {
            $table->string('date', 8)->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('vendor_return_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->unique()->constrained('vendor_accounts')->cascadeOnDelete();
            $table->boolean('returnable')->default(true);
            $table->unsignedSmallInteger('return_window_days')->default(7);
            $table->json('accepted_reasons');
            $table->boolean('requires_unused')->default(true);
            $table->boolean('requires_evidence')->default(true);
            $table->string('return_shipping_paid_by', 16)->default('customer');
            $table->boolean('shipping_refundable')->default(false);
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('return_policy_override_enabled')->default(false)->after('warranty');
            $table->boolean('returnable')->nullable()->after('return_policy_override_enabled');
            $table->unsignedSmallInteger('return_window_days')->nullable()->after('returnable');
            $table->json('return_accepted_reasons')->nullable()->after('return_window_days');
            $table->boolean('return_requires_unused')->nullable()->after('return_accepted_reasons');
            $table->boolean('return_requires_evidence')->nullable()->after('return_requires_unused');
            $table->string('return_shipping_paid_by', 16)->nullable()->after('return_requires_evidence');
            $table->boolean('return_shipping_refundable')->nullable()->after('return_shipping_paid_by');
        });

        Schema::create('return_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 32)->unique();
            $table->foreignUuid('order_id')->constrained('orders')->restrictOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->restrictOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 32);
            $table->string('reason', 32);
            $table->text('customer_note')->nullable();
            $table->text('vendor_note')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->json('policy_snapshot');
            $table->timestamps();

            $table->index(['vendor_order_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['order_id']);
        });

        Schema::create('return_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('return_request_id')->constrained('return_requests')->cascadeOnDelete();
            $table->foreignUuid('order_item_id')->constrained('order_items')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('line_subtotal', 12, 2);
            $table->timestamps();

            $table->unique(['return_request_id', 'order_item_id']);
            $table->index(['order_item_id']);
        });

        Schema::create('return_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('return_request_id')->constrained('return_requests')->cascadeOnDelete();
            $table->foreignUuid('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('disk', 32)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 128);
            $table->unsignedBigInteger('size_bytes');
            $table->timestamps();

            $table->index(['return_request_id']);
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 32)->unique();
            $table->foreignUuid('return_request_id')->unique()->constrained('return_requests')->restrictOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->restrictOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->restrictOnDelete();
            $table->foreignUuid('payment_id')->constrained('payments')->restrictOnDelete();
            $table->foreignUuid('payment_vendor_allocation_id')->nullable()->constrained('payment_vendor_allocations')->nullOnDelete();
            $table->string('status', 32);
            $table->decimal('items_subtotal', 12, 2);
            $table->decimal('vat_amount', 12, 2)->default(0);
            $table->decimal('shipping_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->decimal('vendor_payable_reversal', 12, 2);
            $table->decimal('commission_reversal', 12, 2);
            $table->string('currency', 3);
            $table->string('gateway_refund_id', 64)->nullable();
            $table->string('idempotency_key', 64)->unique();
            $table->timestamp('processed_at')->nullable();
            $table->json('breakdown');
            $table->timestamps();

            $table->index(['vendor_order_id', 'status']);
            $table->index(['payment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('return_evidence');
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('return_requests');
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'return_policy_override_enabled',
                'returnable',
                'return_window_days',
                'return_accepted_reasons',
                'return_requires_unused',
                'return_requires_evidence',
                'return_shipping_paid_by',
                'return_shipping_refundable',
            ]);
        });
        Schema::dropIfExists('vendor_return_policies');
        Schema::dropIfExists('return_number_sequences');
        Schema::dropIfExists('refund_number_sequences');
    }
};
