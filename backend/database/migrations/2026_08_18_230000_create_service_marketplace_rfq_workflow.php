<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignUuid('provider_account_id')->nullable()->constrained('provider_accounts')->nullOnDelete();
            $table->string('reference')->unique();
            $table->string('title');
            $table->text('description');
            $table->decimal('budget_min', 12, 2)->nullable();
            $table->decimal('budget_max', 12, 2)->nullable();
            $table->string('location')->nullable();
            $table->json('reference_links')->nullable();
            $table->string('status')->default('pending');
            $table->foreignUuid('accepted_offer_id')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'created_at']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('service_request_category', function (Blueprint $table) {
            $table->foreignUuid('service_request_id')->constrained('service_requests')->cascadeOnDelete();
            $table->foreignUuid('service_category_id')->constrained('service_categories')->cascadeOnDelete();

            $table->primary(['service_request_id', 'service_category_id']);
        });

        Schema::create('service_request_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->constrained('service_requests')->cascadeOnDelete();
            $table->foreignUuid('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->timestamps();

            $table->index(['service_request_id']);
        });

        Schema::create('service_offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->constrained('service_requests')->cascadeOnDelete();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->decimal('proposed_price', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->unsignedInteger('duration_days')->nullable();
            $table->text('message')->nullable();
            $table->string('quotation_disk')->nullable();
            $table->string('quotation_path')->nullable();
            $table->string('quotation_original_name')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->unique(['service_request_id', 'provider_account_id']);
            $table->index(['service_request_id', 'status']);
            $table->index(['provider_account_id', 'status']);
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->foreign('accepted_offer_id')
                ->references('id')
                ->on('service_offers')
                ->nullOnDelete();
        });

        Schema::create('service_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_offer_id')->constrained('service_offers')->restrictOnDelete();
            $table->foreignUuid('service_request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->restrictOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('reference')->unique();
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->string('location')->nullable();
            $table->text('customer_notes')->nullable();
            $table->text('provider_notes')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('payment_strategy')->default('full');
            $table->string('payment_status')->default('pending');
            $table->string('status')->default('pending_payment');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['provider_account_id', 'status']);
        });

        Schema::create('service_booking_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_booking_id')->constrained('service_bookings')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('gateway')->default('local');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('gateway_payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['service_booking_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_booking_payments');
        Schema::dropIfExists('service_bookings');
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropForeign(['accepted_offer_id']);
        });
        Schema::dropIfExists('service_offers');
        Schema::dropIfExists('service_request_attachments');
        Schema::dropIfExists('service_request_category');
        Schema::dropIfExists('service_requests');
    }
};
