<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway', 32)->nullable()->after('currency');
            $table->string('payment_reference', 64)->nullable()->unique()->after('gateway');
            $table->string('gateway_payment_id', 64)->nullable()->after('payment_reference');
            $table->string('gateway_invoice_id', 64)->nullable()->after('gateway_payment_id');
            $table->timestamp('paid_at')->nullable()->after('gateway_invoice_id');
            $table->timestamp('failed_at')->nullable()->after('paid_at');
            $table->string('failure_reason', 255)->nullable()->after('failed_at');

            $table->index('gateway_payment_id');
            $table->index('gateway_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['gateway_payment_id']);
            $table->dropIndex(['gateway_invoice_id']);
            $table->dropColumn([
                'gateway',
                'payment_reference',
                'gateway_payment_id',
                'gateway_invoice_id',
                'paid_at',
                'failed_at',
                'failure_reason',
            ]);
        });
    }
};
