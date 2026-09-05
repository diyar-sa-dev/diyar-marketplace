<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_feedback', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_key', 64)->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('type', 32);
            $table->text('message');
            $table->string('locale', 8)->nullable();
            $table->timestamps();

            $table->unique('user_id');
            $table->unique('guest_key');
            $table->index(['type', 'created_at']);
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_feedback');
    }
};
