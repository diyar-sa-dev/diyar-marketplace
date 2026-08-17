<?php

namespace Tests\Feature\Api\V1\Finance;

use App\Enums\FinancePeriod;
use App\Enums\RoleName;
use App\Enums\VendorOrderStatus;
use App\Models\PaymentVendorAllocation;
use App\Services\Order\VendorOrderStateService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class VendorFinanceApiTest extends TestCase
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
    public function vendor_finance_summary_is_scoped_to_authenticated_vendor(): void
    {
        $this->fakePaymentGateway();

        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        [, $orderA] = $this->createPayableOrderForVendor($vendorA);
        app(PaymentFinalizationService::class)->finalizePaid(
            $orderA->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $allocationA = PaymentVendorAllocation::query()
            ->where('payment_id', $orderA->payment->id)
            ->firstOrFail();

        $responseA = $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary?period=month', $vendorA)
            ->assertOk()
            ->json('data.report.summary');

        $this->assertSame(
            number_format((float) $allocationA->vendor_gross_total, 2, '.', ''),
            $responseA['gross_sales'],
        );

        $responseB = $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary?period=month', $vendorB)
            ->assertOk()
            ->json('data.report.summary');

        $this->assertSame('0.00', $responseB['gross_sales']);
    }

    #[Test]
    public function vendor_cannot_access_other_vendor_transactions(): void
    {
        $this->fakePaymentGateway();

        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        [, $orderA] = $this->createPayableOrderForVendor($vendorA);
        app(PaymentFinalizationService::class)->finalizePaid(
            $orderA->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/transactions', $vendorB)
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 0);
    }

    #[Test]
    public function finance_analytics_supports_period_parameter(): void
    {
        $this->fakePaymentGateway();
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        [, $order] = $this->createPayableOrderForVendor($vendor);
        app(PaymentFinalizationService::class)->finalizePaid(
            $order->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $vendorOrder = $order->vendorOrders->first();
        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        foreach (FinancePeriod::cases() as $period) {
            $this->getJsonAsUser(
                '/api/v1/dashboard/vendor/finance/analytics?period='.$period->value,
                $vendor,
            )->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'period' => ['type', 'from', 'to'],
                        'analytics',
                    ],
                ]);
        }
    }

    #[Test]
    public function finance_report_export_returns_csv(): void
    {
        $this->fakePaymentGateway();
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        [, $order] = $this->createPayableOrderForVendor($vendor);
        app(PaymentFinalizationService::class)->finalizePaid(
            $order->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        Sanctum::actingAs($vendor);

        $response = $this->get('/api/v1/dashboard/vendor/finance/report?period=month');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Gross sales', $content);

        $responseAr = $this->withHeaders(['Accept-Language' => 'ar'])
            ->get('/api/v1/dashboard/vendor/finance/report?period=month');

        $responseAr->assertOk();
        $contentAr = $responseAr->streamedContent();
        $this->assertStringContainsString('إجمالي المبيعات', $contentAr);
        $this->assertStringContainsString('إيراد طلب', $contentAr);
        $this->assertDoesNotMatchRegularExpression('/Ø/u', $contentAr);
    }
}
