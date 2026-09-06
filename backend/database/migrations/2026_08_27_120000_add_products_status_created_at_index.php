<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 28.9 OPT-DB-001 — Support public catalog list:
     * WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC
     *
     * Evidence: Phase 28.7 EXPLAIN showed type=ALL + Using filesort on products @ 500 rows.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'products_status_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_status_created_at_index');
        });
    }
};
