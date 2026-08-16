<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->unsignedInteger('previous_stock_quantity')->nullable()->after('quantity');
            $table->unsignedInteger('resulting_stock_quantity')->nullable()->after('previous_stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropColumn(['previous_stock_quantity', 'resulting_stock_quantity']);
        });
    }
};
