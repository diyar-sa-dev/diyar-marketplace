<?php

namespace Tests\Integration\Security;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Production DB gate: validates user_sessions migration on MySQL/MariaDB.
 *
 * Run with:
 * DB_CONNECTION=mysql DB_HOST=127.0.0.1 DB_PORT=3308 DB_DATABASE=diyar_multinode DB_USERNAME=root DB_PASSWORD=multinode php artisan test --group=mysql-session-integration
 */
#[Group('mysql-session-integration')]
class UserSessionsMigrationIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'mysql') {
            config(['database.default' => 'mysql']);
        }

        if (config('database.default') !== 'mysql') {
            $this->markTestSkipped('DB_CONNECTION is not mysql');
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $exception) {
            $this->markTestSkipped('MySQL unreachable: '.$exception->getMessage());
        }
    }

    #[Test]
    public function user_sessions_migration_applies_with_expected_indexes_on_mysql(): void
    {
        Artisan::call('migrate:fresh', ['--force' => true]);

        $this->assertTrue(Schema::hasTable('user_sessions'));

        $indexes = collect(DB::select('SHOW INDEX FROM user_sessions'))
            ->pluck('Key_name')
            ->unique()
            ->values()
            ->all();

        $this->assertContains('PRIMARY', $indexes);
        $this->assertContains('user_sessions_session_lookup_hash_unique', $indexes);
        $this->assertContains('user_sessions_user_id_revoked_at_index', $indexes);

        $user = User::factory()->create();
        $hash = str_repeat('b', 64);

        UserSession::query()->create([
            'user_id' => $user->id,
            'session_lookup_hash' => $hash,
            'laravel_session_id' => 'session-a',
            'first_seen_at' => now(),
            'last_activity_at' => now(),
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        UserSession::query()->create([
            'user_id' => $user->id,
            'session_lookup_hash' => $hash,
            'laravel_session_id' => 'session-b',
            'first_seen_at' => now(),
            'last_activity_at' => now(),
        ]);
    }
}
