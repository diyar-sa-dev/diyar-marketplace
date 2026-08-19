<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_work_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_account_id')->unique()->constrained('provider_accounts')->cascadeOnDelete();
            $table->boolean('policy_enabled')->default(true);
            $table->unsignedSmallInteger('initial_delivery_days')->default(7);
            $table->unsignedSmallInteger('free_revisions_included')->default(2);
            $table->boolean('timeline_by_project_scope')->default(true);
            $table->unsignedSmallInteger('cancellation_notice_hours')->nullable();
            $table->json('custom_terms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_work_policies');
    }
};
