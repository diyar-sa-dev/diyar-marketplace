<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\RoleName;
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

class PaymentWebhookMalformedPayloadTest extends TestCase
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
        config(['myfatoorah.webhook_secret_key' => self::WEBHOOK_SECRET]);
    }

    #[Test]
    public function webhook_rejects_malformed_json_body(): void
    {
        $this->call(
            'POST',
            '/api/v1/webhooks/payments/myfatoorah',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_MyFatoorah-Signature' => 'invalid',
                'HTTP_MyFatoorah-Webhook-Version' => 'v2',
            ],
            '{not-json',
        )->assertStatus(400);
    }

    #[Test]
    public function webhook_rejects_missing_signature_header(): void
    {
        $payload = ['Event' => ['Code' => 1], 'Data' => []];
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $this->call(
            'POST',
            '/api/v1/webhooks/payments/myfatoorah',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_MyFatoorah-Webhook-Version' => 'v2',
            ],
            $body,
        )->assertStatus(400);
    }

    #[Test]
    public function webhook_duplicate_event_id_is_idempotent(): void
    {
        $this->fakePaymentGateway();
        $order = $this->createPendingOrderWithPayment();
        $payload = $this->v2WebhookPayload($order->order_number, FakePaymentGateway::$gatewayPaymentId);
        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $headers = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_MyFatoorah-Signature' => $this->v2Signature($payload),
            'HTTP_MyFatoorah-Webhook-Version' => 'v2',
        ];

        $this->call('POST', '/api/v1/webhooks/payments/myfatoorah', [], [], [], $headers, $body)->assertOk();
        $this->call('POST', '/api/v1/webhooks/payments/myfatoorah', [], [], [], $headers, $body)
            ->assertOk()
            ->assertJsonPath('data.duplicate', true);

        $this->assertSame(1, PaymentWebhookEvent::query()->where('payment_id', $order->payment->id)->count());
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

        $output = implode(',', array_map(
            fn (string $key, string $value) => sprintf('%s=%s', $key, $value),
            array_keys($dataModel),
            array_values($dataModel),
        ));

        return base64_encode(hash_hmac('sha256', $output, self::WEBHOOK_SECRET, true));
    }
}
