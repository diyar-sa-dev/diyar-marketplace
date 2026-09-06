<?php

namespace App\Console\Commands;

use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Console\Command;

final class SyncAdminPermissionsCommand extends Command
{
    protected $signature = 'diyar:sync-admin-permissions';

    protected $description = 'Sync admin permission records and attach missing keys to the admin role';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => AdminPermissionSeeder::class, '--force' => true]);

        $this->info('Admin permissions synced and permission cache cleared.');

        return self::SUCCESS;
    }
}
