<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('b2b_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('b2b_companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('b2b_category_id')->nullable()->constrained('b2b_categories')->nullOnDelete();
            $table->foreignUuid('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('vendor_account_id')->nullable()->constrained('vendor_accounts')->nullOnDelete();
            $table->foreignUuid('provider_account_id')->nullable()->constrained('provider_accounts')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('about')->nullable();
            $table->string('logo')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->unsignedSmallInteger('years_experience')->nullable();
            $table->unsignedSmallInteger('team_size')->nullable();
            $table->unsignedInteger('completed_projects')->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->string('publication_status')->default('draft');
            $table->string('verification_status')->default('pending');
            $table->boolean('featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['publication_status', 'published_at']);
            $table->index('b2b_category_id');
            $table->index('verification_status');
            $table->index('featured');
            $table->index('owner_user_id');
            $table->unique('vendor_account_id');
            $table->unique('provider_account_id');
        });

        Schema::create('b2b_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('b2b_company_tag', function (Blueprint $table) {
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->foreignUuid('b2b_tag_id')->constrained('b2b_tags')->cascadeOnDelete();
            $table->primary(['b2b_company_id', 'b2b_tag_id']);
        });

        Schema::create('b2b_company_project', function (Blueprint $table) {
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->primary(['b2b_company_id', 'project_id']);
            $table->index(['b2b_company_id', 'sort_order']);
        });

        Schema::create('b2b_company_services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['b2b_company_id', 'sort_order']);
        });

        Schema::create('b2b_company_testimonials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->string('author_name');
            $table->string('author_role')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['b2b_company_id', 'sort_order']);
        });

        Schema::create('b2b_leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('project_type');
            $table->string('estimated_quantity')->nullable();
            $table->text('details');
            $table->string('budget_range')->default('unspecified');
            $table->string('status')->default('new');
            $table->timestamps();

            $table->index(['b2b_company_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('b2b_leads');
        Schema::dropIfExists('b2b_company_testimonials');
        Schema::dropIfExists('b2b_company_services');
        Schema::dropIfExists('b2b_company_project');
        Schema::dropIfExists('b2b_company_tag');
        Schema::dropIfExists('b2b_tags');
        Schema::dropIfExists('b2b_companies');
        Schema::dropIfExists('b2b_categories');
    }
};
