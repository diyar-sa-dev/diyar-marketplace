<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_designs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255)->nullable();
            $table->json('document');
            $table->unsignedSmallInteger('schema_version')->default(1);
            $table->unsignedInteger('version')->default(1);
            $table->unsignedSmallInteger('item_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'updated_at']);
            $table->index(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_designs');
    }
};
