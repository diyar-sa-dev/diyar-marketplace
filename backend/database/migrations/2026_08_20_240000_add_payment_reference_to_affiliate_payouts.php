<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_payouts', function (Blueprint $table) {
            $table->string('payment_reference', 128)->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_payouts', function (Blueprint $table) {
            $table->dropColumn('payment_reference');
        });
    }
};
