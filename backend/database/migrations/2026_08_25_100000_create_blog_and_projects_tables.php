<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('blog_articles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('blog_category_id')->nullable()->constrained('blog_categories')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('hero_image')->nullable();
            $table->string('author_name');
            $table->string('author_avatar')->nullable();
            $table->string('author_role')->nullable();
            $table->unsignedSmallInteger('reading_time_minutes')->default(1);
            $table->timestamp('published_at')->nullable();
            $table->string('status')->default('draft');
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index('blog_category_id');
        });

        Schema::create('blog_article_tag', function (Blueprint $table) {
            $table->foreignUuid('blog_article_id')->constrained('blog_articles')->cascadeOnDelete();
            $table->foreignUuid('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->primary(['blog_article_id', 'blog_tag_id']);
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category');
            $table->string('location')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('status')->default('draft');
            $table->string('cover_image')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index('category');
        });

        Schema::create('project_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('image_url');
            $table->string('alt')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_images');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('blog_article_tag');
        Schema::dropIfExists('blog_articles');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('blog_categories');
    }
};
