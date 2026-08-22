<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('group');
            $table->string('key');
            $table->json('value');
            $table->string('type');
            $table->boolean('is_public')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['group', 'key']);
            $table->index('group');
            $table->index('is_public');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
