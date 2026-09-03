<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminResourceParityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public static function adminIndexRoutesProvider(): array
    {
        return [
            ['/api/v1/admin/dashboard'],
            ['/api/v1/admin/users'],
            ['/api/v1/admin/vendor-accounts'],
            ['/api/v1/admin/provider-accounts'],
            ['/api/v1/admin/categories'],
            ['/api/v1/admin/orders'],
            ['/api/v1/admin/products'],
            ['/api/v1/admin/payouts'],
            ['/api/v1/admin/provider/payouts'],
            ['/api/v1/admin/affiliate/payouts'],
            ['/api/v1/admin/audit-logs'],
            ['/api/v1/admin/settings'],
            ['/api/v1/admin/payments'],
            ['/api/v1/admin/return-requests'],
            ['/api/v1/admin/coupons'],
            ['/api/v1/admin/reviews/products'],
            ['/api/v1/admin/roles'],
            ['/api/v1/admin/permissions'],
            ['/api/v1/admin/service-requests'],
            ['/api/v1/admin/service-bookings'],
            ['/api/v1/admin/inventory/products'],
            ['/api/v1/admin/inventory/movements'],
            ['/api/v1/admin/shipments'],
            ['/api/v1/admin/notifications'],
            ['/api/v1/admin/transactions'],
            ['/api/v1/admin/reports/summary'],
            ['/api/v1/admin/affiliate/profiles'],
            ['/api/v1/admin/affiliate/links'],
            ['/api/v1/admin/affiliate/clicks'],
            ['/api/v1/admin/affiliate/attributions'],
            ['/api/v1/admin/affiliate/commissions'],
        ];
    }

    #[DataProvider('adminIndexRoutesProvider')]
    public function test_admin_can_access_index_routes(string $uri): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $this->actingAsAdmin($admin);

        $this->getJson($uri)->assertOk();
    }

    public function test_marketplace_user_cannot_access_admin_routes(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        foreach (self::adminIndexRoutesProvider() as [$uri]) {
            $this->actingAs($vendor, 'web');
            $this->getJson($uri)->assertUnauthorized();
        }
    }

    public function test_unauthenticated_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/v1/admin/users')->assertUnauthorized();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }
}
