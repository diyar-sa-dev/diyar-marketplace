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
                        'series',
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

    public function test_admin_can_list_and_process_provider_payouts(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $providerUser = $this->createUserWithRole(RoleName::Provider);
        $provider = $providerUser->providerAccount()->firstOrFail();

        $payout = \App\Models\ProviderPayout::query()->create([
            'reference' => 'PO-TEST-PROVIDER-1',
            'provider_account_id' => $provider->id,
            'amount' => '150.00',
            'currency' => 'SAR',
            'status' => \App\Enums\PayoutStatus::Pending,
            'requested_at' => now(),
        ]);

        $this->getJsonAsAdmin('/api/v1/admin/provider/payouts', $admin)
            ->assertOk()
            ->assertJsonPath('data.payouts.0.id', $payout->id)
            ->assertJsonPath('data.payouts.0.provider.business_name', $provider->business_name);

        $this->postJsonAsAdmin("/api/v1/admin/provider/payouts/{$payout->id}/approve", $admin)
            ->assertOk()
            ->assertJsonPath('data.payout.status', 'approved');

        $this->postJsonAsAdmin("/api/v1/admin/provider/payouts/{$payout->id}/mark-paid", $admin)
            ->assertOk()
            ->assertJsonPath('data.payout.status', 'paid');
    }
}
