<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Vendor Pickup Origins (Addresses)
        if (! Schema::hasTable('vendor_pickup_addresses')) {
            Schema::create('vendor_pickup_addresses', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
                $table->string('contact_name');
                $table->string('contact_phone', 32);
                $table->string('city');
                $table->string('district')->nullable();
                $table->string('street')->nullable();
                $table->string('building_number', 16)->nullable();
                $table->string('postal_code', 16)->nullable();
                $table->string('national_short_address', 16)->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_default')->default(false);
                $table->timestamps();

                $table->index(['vendor_account_id', 'is_default']);
            });
        }

        // 2. Carrier Integrations Configuration Vault
        if (! Schema::hasTable('carrier_configurations')) {
            Schema::create('carrier_configurations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('carrier_code', 64)->unique(); // 'mock', 'torod', 'aymakan', 'smsa'
                $table->string('name');
                $table->boolean('is_active')->default(false);
                $table->boolean('is_sandbox')->default(true);
                $table->text('api_token_encrypted')->nullable();
                $table->text('account_id_encrypted')->nullable();
                $table->text('webhook_secret_encrypted')->nullable();
                $table->json('settings')->nullable();
                $table->timestamps();
            });
        }

        // 3. Carrier Shipments (1:0..1 relationship with shipments)
        if (! Schema::hasTable('carrier_shipments')) {
            Schema::create('carrier_shipments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('shipment_id')->unique()->constrained('shipments')->cascadeOnDelete();
                $table->foreignUuid('carrier_id')->nullable()->constrained('shipping_carriers')->nullOnDelete();
                $table->string('carrier_code', 64);
                $table->string('external_shipment_id', 128)->nullable()->index();
                $table->string('tracking_number', 128)->nullable()->index();
                $table->string('label_url', 512)->nullable();
                $table->string('label_storage_path', 512)->nullable();
                $table->decimal('carrier_quoted_cost', 12, 2)->default(0);
                $table->decimal('carrier_actual_cost', 12, 2)->default(0);
                $table->string('booking_status', 32)->default('pending'); // 'pending', 'confirmed', 'unknown_outcome', 'failed', 'cancelled'
                $table->timestamp('booked_at')->nullable();
                $table->timestamps();
            });
        }

        // 4. Carrier Booking Attempts & Audit Trail
        if (! Schema::hasTable('carrier_booking_attempts')) {
            Schema::create('carrier_booking_attempts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('carrier_shipment_id')->constrained('carrier_shipments')->cascadeOnDelete();
                $table->string('idempotency_key', 64)->unique();
                $table->string('status', 32); // 'initiated', 'succeeded', 'timeout', 'failed'
                $table->json('request_payload_sanitized')->nullable();
                $table->json('response_payload_sanitized')->nullable();
                $table->string('error_code', 64)->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();
            });
        }

        // 5. Carrier Webhook Events (Deduplication & Replay Protection)
        if (! Schema::hasTable('carrier_webhook_events')) {
            Schema::create('carrier_webhook_events', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('carrier_code', 64);
                $table->string('provider_event_id', 128)->index();
                $table->string('event_type', 64);
                $table->string('tracking_number', 128)->nullable()->index();
                $table->json('payload');
                $table->boolean('is_processed')->default(false);
                $table->timestamps();

                $table->unique(['carrier_code', 'provider_event_id'], 'carrier_webhook_unique_event');
            });
        }

        // 6. Vendor Shipping Settings Extensions
        Schema::table('vendor_shipping_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('vendor_shipping_settings', 'allowed_by_admin')) {
                $table->boolean('allowed_by_admin')->default(true)->after('use_advanced_rules');
            }
            if (! Schema::hasColumn('vendor_shipping_settings', 'carrier_api_enabled')) {
                $table->boolean('carrier_api_enabled')->default(false)->after('allowed_by_admin');
            }
            if (! Schema::hasColumn('vendor_shipping_settings', 'selected_carrier_code')) {
                $table->string('selected_carrier_code', 64)->nullable()->after('carrier_api_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vendor_shipping_settings', function (Blueprint $table) {
            if (Schema::hasColumn('vendor_shipping_settings', 'selected_carrier_code')) {
                $table->dropColumn('selected_carrier_code');
            }
            if (Schema::hasColumn('vendor_shipping_settings', 'carrier_api_enabled')) {
                $table->dropColumn('carrier_api_enabled');
            }
            if (Schema::hasColumn('vendor_shipping_settings', 'allowed_by_admin')) {
                $table->dropColumn('allowed_by_admin');
            }
        });

        Schema::dropIfExists('carrier_webhook_events');
        Schema::dropIfExists('carrier_booking_attempts');
        Schema::dropIfExists('carrier_shipments');
        Schema::dropIfExists('carrier_configurations');
        Schema::dropIfExists('vendor_pickup_addresses');
    }
};
