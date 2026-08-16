<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_accounts', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('business_name');
            $table->text('description')->nullable()->after('slug');
            $table->string('location')->nullable()->after('description');
            $table->string('status')->default('active')->after('location');
            $table->string('logo_path')->nullable()->after('status');
            $table->string('cover_path')->nullable()->after('logo_path');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_accounts', function (Blueprint $table) {
            $table->dropColumn(['slug', 'description', 'location', 'status', 'logo_path', 'cover_path']);
        });
    }
};
