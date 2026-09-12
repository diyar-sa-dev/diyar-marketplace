<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visual_index_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('product_image_id')->constrained('product_images')->cascadeOnDelete();
            $table->foreignUuid('media_file_id')->constrained('media_files')->cascadeOnDelete();
            $table->binary('hash_bits', 8);
            $table->unsignedSmallInteger('hash_bucket');
            $table->string('engine_version', 32);
            $table->string('representation_version', 32);
            $table->string('index_version', 64);
            $table->boolean('is_active')->default(true);
            $table->timestamp('indexed_at');
            $table->timestamps();

            $table->unique('product_image_id', 'uq_visual_index_product_image');
            $table->unique('media_file_id', 'uq_visual_index_media');
            $table->index(['hash_bucket', 'is_active', 'index_version'], 'idx_visual_index_bucket_active');
            $table->index(['product_id', 'is_active'], 'idx_visual_index_product');
            $table->index(['index_version', 'is_active'], 'idx_visual_index_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visual_index_entries');
    }
};
