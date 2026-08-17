<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_shipping_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->unique()->constrained('vendor_accounts')->cascadeOnDelete();
            $table->boolean('carrier_enabled')->default(false);
            $table->decimal('carrier_flat_rate', 12, 2)->nullable();
            $table->boolean('carrier_free_shipping_enabled')->default(false);
            $table->decimal('carrier_free_shipping_threshold', 12, 2)->nullable();
            $table->boolean('pickup_enabled')->default(false);
            $table->string('pickup_location_label', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_shipping_settings');
    }
};
