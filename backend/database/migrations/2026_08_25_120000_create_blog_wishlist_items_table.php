<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_wishlist_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('blog_article_id')->constrained('blog_articles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'blog_article_id']);
            $table->index('blog_article_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_wishlist_items');
    }
};
