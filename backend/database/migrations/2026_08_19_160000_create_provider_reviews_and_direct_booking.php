<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_booking_id')->constrained('service_bookings')->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('comment')->nullable();
            $table->string('status')->default('published');
            $table->text('provider_response')->nullable();
            $table->timestamp('provider_responded_at')->nullable();
            $table->foreignUuid('provider_responded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['service_booking_id', 'user_id']);
            $table->index(['provider_account_id', 'status', 'created_at']);
            $table->index(['provider_account_id', 'rating']);
            $table->index('user_id');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->string('booking_mode')->default('request')->after('pricing_mode');
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('duration_label');
        });

        DB::table('services')
            ->where('pricing_mode', 'fixed')
            ->update(['booking_mode' => 'direct']);

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->string('booking_source')->default('rfq')->after('service_id');
            $table->string('idempotency_key')->nullable()->after('reference');
            $table->string('service_title_snapshot')->nullable()->after('service_id');
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('scheduled_time');
        });

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->dropForeign(['service_offer_id']);
            $table->dropForeign(['service_request_id']);
        });

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->uuid('service_offer_id')->nullable()->change();
            $table->uuid('service_request_id')->nullable()->change();
        });

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->foreign('service_offer_id')->references('id')->on('service_offers')->nullOnDelete();
            $table->foreign('service_request_id')->references('id')->on('service_requests')->nullOnDelete();
            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['provider_account_id', 'scheduled_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('service_bookings', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'idempotency_key']);
            $table->dropIndex(['provider_account_id', 'scheduled_date', 'status']);
            $table->dropForeign(['service_offer_id']);
            $table->dropForeign(['service_request_id']);
        });

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->uuid('service_offer_id')->nullable(false)->change();
            $table->uuid('service_request_id')->nullable(false)->change();
            $table->dropColumn([
                'booking_source',
                'idempotency_key',
                'service_title_snapshot',
                'duration_minutes',
            ]);
        });

        Schema::table('service_bookings', function (Blueprint $table) {
            $table->foreign('service_offer_id')->references('id')->on('service_offers')->restrictOnDelete();
            $table->foreign('service_request_id')->references('id')->on('service_requests')->restrictOnDelete();
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['booking_mode', 'duration_minutes']);
        });

        Schema::dropIfExists('provider_reviews');
    }
};
