<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon_key')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::table('provider_accounts', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('business_name');
            $table->text('bio')->nullable()->after('slug');
            $table->string('avatar_path')->nullable()->after('bio');
            $table->string('cover_path')->nullable()->after('avatar_path');
            $table->string('location')->nullable()->after('cover_path');
            $table->boolean('remote_available')->default(false)->after('location');
            $table->boolean('verified')->default(false)->after('remote_available');
            $table->json('working_hours')->nullable()->after('verified');
            $table->json('badges')->nullable()->after('working_hours');
            $table->string('status')->default('active')->after('badges');
            $table->unsignedInteger('completed_projects_count')->default(0)->after('status');
            $table->decimal('rating_average', 3, 2)->default(0)->after('completed_projects_count');
            $table->unsignedInteger('reviews_count')->default(0)->after('rating_average');
            $table->timestamp('joined_at')->nullable()->after('reviews_count');
        });

        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->foreignUuid('service_category_id')->constrained('service_categories')->restrictOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('pricing_mode');
            $table->decimal('starting_price', 12, 2)->nullable();
            $table->string('currency', 3)->default('SAR');
            $table->string('delivery_type_label')->nullable();
            $table->string('location')->nullable();
            $table->boolean('remote_available')->default(false);
            $table->json('features')->nullable();
            $table->string('cover_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('requests_count')->default(0);
            $table->decimal('rating_average', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->timestamps();

            $table->unique(['provider_account_id', 'slug']);
            $table->index(['service_category_id', 'is_active']);
            $table->index(['provider_account_id', 'is_active']);
            $table->index(['is_active', 'created_at']);
            $table->index('pricing_mode');
            $table->index('starting_price');
            $table->index('rating_average');
        });

        Schema::create('service_portfolio_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('media_path');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['provider_account_id', 'sort_order']);
            $table->index(['service_id', 'sort_order']);
        });

        Schema::create('provider_follows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'provider_account_id']);
            $table->index(['provider_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_follows');
        Schema::dropIfExists('service_portfolio_items');
        Schema::dropIfExists('services');
        Schema::table('provider_accounts', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'bio',
                'avatar_path',
                'cover_path',
                'location',
                'remote_available',
                'verified',
                'working_hours',
                'badges',
                'status',
                'completed_projects_count',
                'rating_average',
                'reviews_count',
                'joined_at',
            ]);
        });
        Schema::dropIfExists('service_categories');
    }
};
