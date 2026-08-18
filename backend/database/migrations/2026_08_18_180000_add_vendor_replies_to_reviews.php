<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->text('vendor_reply')->nullable()->after('comment');
            $table->timestamp('vendor_replied_at')->nullable()->after('vendor_reply');
            $table->foreignUuid('vendor_replied_by_user_id')->nullable()->after('vendor_replied_at')->constrained('users')->nullOnDelete();
        });

        Schema::table('store_reviews', function (Blueprint $table) {
            $table->text('vendor_reply')->nullable()->after('comment');
            $table->timestamp('vendor_replied_at')->nullable()->after('vendor_reply');
            $table->foreignUuid('vendor_replied_by_user_id')->nullable()->after('vendor_replied_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_replied_by_user_id');
            $table->dropColumn(['vendor_reply', 'vendor_replied_at']);
        });

        Schema::table('store_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_replied_by_user_id');
            $table->dropColumn(['vendor_reply', 'vendor_replied_at']);
        });
    }
};
