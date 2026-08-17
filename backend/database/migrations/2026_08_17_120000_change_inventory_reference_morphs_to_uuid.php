<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->dropMorphs('reference');
        });

        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->nullableUuidMorphs('reference');
        });

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropMorphs('reference');
        });

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->nullableUuidMorphs('reference');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->dropMorphs('reference');
        });

        Schema::table('inventory_reservations', function (Blueprint $table) {
            $table->nullableMorphs('reference');
        });

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropMorphs('reference');
        });

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->nullableMorphs('reference');
        });
    }
};
