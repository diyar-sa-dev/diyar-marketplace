<?php

namespace Tests\Feature\Api\V1\Dashboard;

use App\Enums\RoleName;
use App\Enums\VendorOrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class VendorDashboardOverviewTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithFinance;
    use InteractsWithIdentity;
    use InteractsWithPayments;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
    }

    #[Test]
    public function vendor_overview_returns_real_metrics(): void
    {
        $this->fakePaymentGateway();
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        [, $order] = $this->createPayableOrderForVendor($vendor);
        $vendorOrder = $order->vendorOrders->first();
        $vendorOrder->update(['status' => VendorOrderStatus::Delivered]);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/overview', $vendor)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'overview' => [
                        'currency',
                        'period_sales',
                        'available_balance',
                        'pending_escrow',
                        'orders' => ['pending', 'completed', 'cancelled'],
                        'returns' => ['open'],
                        'products' => ['active', 'low_stock'],
                        'sales_chart',
                        'recent_orders',
                        'low_stock_products',
                    ],
                ],
            ])
            ->assertJsonPath('data.overview.orders.completed', 1);
    }

    #[Test]
    public function vendor_overview_is_isolated_between_vendors(): void
    {
        $this->fakePaymentGateway();
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        [, $order] = $this->createPayableOrderForVendor($vendorA);
        $order->vendorOrders->first()->update(['status' => VendorOrderStatus::Delivered]);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/overview', $vendorB)
            ->assertOk()
            ->assertJsonPath('data.overview.orders.completed', 0);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/overview', $vendorA)
            ->assertOk()
            ->assertJsonPath('data.overview.orders.completed', 1);
    }
}
