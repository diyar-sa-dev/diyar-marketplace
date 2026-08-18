<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_accounts', function (Blueprint $table) {
            $table->string('support_phone')->nullable()->after('cover_path');
            $table->string('support_email')->nullable()->after('support_phone');
        });

        Schema::create('vendor_legal_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->unique()->constrained('vendor_accounts')->cascadeOnDelete();
            $table->string('entity_type');
            $table->string('commercial_registration_number');
            $table->string('tax_number')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->string('bank_code');
            $table->string('beneficiary_name');
            $table->string('iban');
            $table->string('iban_last4', 4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['vendor_account_id', 'is_active']);
        });

        Schema::create('vendor_working_hours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->string('day');
            $table->boolean('is_closed')->default(false);
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('closes_next_day')->default(false);
            $table->timestamps();

            $table->unique(['vendor_account_id', 'day']);
        });

        Schema::create('vendor_store_follows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'vendor_account_id']);
            $table->index(['vendor_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_store_follows');
        Schema::dropIfExists('vendor_working_hours');
        Schema::dropIfExists('vendor_bank_accounts');
        Schema::dropIfExists('vendor_legal_profiles');

        Schema::table('vendor_accounts', function (Blueprint $table) {
            $table->dropColumn(['support_phone', 'support_email']);
        });
    }
};
