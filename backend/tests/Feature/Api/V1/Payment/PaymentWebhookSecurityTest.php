<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\PaymentWebhookEvent;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class PaymentWebhookSecurityTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithFinance;
    use InteractsWithIdentity;
    use InteractsWithPayments;
    use RefreshDatabase;

    private const WEBHOOK_SECRET = 'stage8-test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
    }

    #[Test]
    public function webhook_rejects_invalid_signature(): void
    {
        config(['myfatoorah.webhook_secret_key' => self::WEBHOOK_SECRET]);

        $payload = $this->v2WebhookPayload('DYR-NO-MATCH', FakePaymentGateway::$gatewayPaymentId);
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $this->call(
            'POST',
            '/api/v1/webhooks/payments/myfatoorah',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_MyFatoorah-Signature' => 'invalid-signature',
                'HTTP_MyFatoorah-Webhook-Version' => 'v2',
            ],
            $body,
        )->assertUnauthorized();
    }

    #[Test]
    public function valid_webhook_finalizes_payment_once_and_duplicate_is_idempotent(): void
    {
        $this->fakePaymentGateway();
        config(['myfatoorah.webhook_secret_key' => self::WEBHOOK_SECRET]);

        $order = $this->createPendingOrderWithPayment();
        $payment = $order->payment;
        $payload = $this->v2WebhookPayload($order->order_number, FakePaymentGateway::$gatewayPaymentId);
        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = $this->v2Signature($payload);

        $headers = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_MyFatoorah-Signature' => $signature,
            'HTTP_MyFatoorah-Webhook-Version' => 'v2',
        ];

        $this->call('POST', '/api/v1/webhooks/payments/myfatoorah', [], [], [], $headers, $body)
            ->assertOk()
            ->assertJsonPath('data.duplicate', false);

        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
        $this->assertSame(0, InventoryReservation::query()
            ->where('reference_id', $order->id)
            ->where('status', 'pending')
            ->count());

        $this->call('POST', '/api/v1/webhooks/payments/myfatoorah', [], [], [], $headers, $body)
            ->assertOk()
            ->assertJsonPath('data.duplicate', true);

        $this->assertSame(1, PaymentWebhookEvent::query()->where('payment_id', $payment->id)->count());
        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
    }

    private function createPendingOrderWithPayment(): Order
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $this->createVendorShippingSettings($vendor->vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        return Order::query()->with('payment')->findOrFail($response->json('data.order.id'));
    }

    /**
     * @return array<string, mixed>
     */
    private function v2WebhookPayload(string $orderNumber, string $gatewayPaymentId): array
    {
        return [
            'Event' => ['Code' => 1, 'Name' => 'PAYMENT_STATUS_CHANGED'],
            'Data' => [
                'Invoice' => [
                    'Id' => '12345',
                    'Status' => 'PAID',
                    'ExternalIdentifier' => $orderNumber,
                ],
                'Transaction' => [
                    'Status' => 'SUCCESS',
                    'PaymentId' => $gatewayPaymentId,
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function v2Signature(array $payload): string
    {
        $data = $payload['Data'];
        $dataModel = [
            'Invoice.Id' => (string) ($data['Invoice']['Id'] ?? ''),
            'Invoice.Status' => (string) ($data['Invoice']['Status'] ?? ''),
            'Transaction.Status' => (string) ($data['Transaction']['Status'] ?? ''),
            'Transaction.PaymentId' => (string) ($data['Transaction']['PaymentId'] ?? ''),
            'Invoice.ExternalIdentifier' => (string) ($data['Invoice']['ExternalIdentifier'] ?? ''),
        ];

        $outputArr = [];

        foreach ($dataModel as $key => $value) {
            $outputArr[] = sprintf('%s=%s', $key, $value);
        }

        $output = implode(',', $outputArr);

        return base64_encode(hash_hmac('sha256', $output, self::WEBHOOK_SECRET, true));
    }
}
