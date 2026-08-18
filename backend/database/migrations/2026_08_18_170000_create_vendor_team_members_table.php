<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_team_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email');
            $table->string('role');
            $table->string('status')->default('invited');
            $table->string('invite_token', 64)->nullable()->unique();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->foreignUuid('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['vendor_account_id', 'email']);
            $table->index(['vendor_account_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_team_members');
    }
};
