<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminFinanceApiTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_finance_summary_returns_ok(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->getJsonAsAdmin('/api/v1/admin/finance/summary?period=month', $admin)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'report' => [
                        'period',
                        'summary',
                        'orders',
                    ],
                ],
            ]);
    }

    public function test_admin_payouts_index_returns_ok(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->getJsonAsAdmin('/api/v1/admin/payouts?page=1&per_page=20', $admin)
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
