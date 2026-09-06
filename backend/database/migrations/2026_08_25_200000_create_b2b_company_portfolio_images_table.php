<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('b2b_company_portfolio_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('b2b_company_id')->constrained('b2b_companies')->cascadeOnDelete();
            $table->string('image_path');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['b2b_company_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('b2b_company_portfolio_images');
    }
};
