<?php

namespace Tests\Unit\Services\Payments\Gateways\MyFatoorah;

use App\Enums\PaymentStatus;
use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentMapper;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentMethodMapper;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentResponseMapper;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookMapper;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MyFatoorahPaymentMapperTest extends TestCase
{
    #[Test]
    public function it_maps_v3_session_payload_using_order_number_reference(): void
    {
        $mapper = new MyFatoorahPaymentMapper;

        $payload = $mapper->mapSessionRequest(new PaymentSessionRequest(
            paymentReference: 'DYR-20260817-000001',
            orderNumber: 'DYR-20260817-000001',
            amount: '147.20',
            currency: 'SAR',
            customerName: 'Fursa User',
            customerEmail: 'user@example.com',
            customerMobile: '501234567',
            mobileCountryCode: '+966',
            language: 'ar',
            callbackUrl: 'https://diyar.test/orders?payment=callback',
            errorUrl: 'https://diyar.test/orders?payment=callback',
            metadata: ['payment_attempt_reference' => 'payment-id'],
        ));

        $this->assertSame(147.20, $payload['Order']['Amount']);
        $this->assertSame('SAR', $payload['Order']['Currency']);
        $this->assertSame('DYR-20260817-000001', $payload['Order']['ExternalIdentifier']);
        $this->assertSame('Fursa User', $payload['Customer']['Name']);
        $this->assertSame('COLLECT_DETAILS', $payload['PaymentMode']);
        $this->assertSame('AR', $payload['Language']);
        $this->assertArrayNotHasKey('MetaData', $payload);
    }

    #[Test]
    public function it_maps_v3_payment_payload_with_source_of_fund(): void
    {
        $mapper = new MyFatoorahPaymentMapper;

        $payload = $mapper->mapPaymentRequest(new PaymentCreationRequest(
            sessionId: 'KWT-test-session',
            paymentReference: 'DYR-20260817-000001',
            orderNumber: 'DYR-20260817-000001',
            amount: '147.20',
            currency: 'SAR',
            customerName: 'Fursa User',
            customerEmail: 'user@example.com',
            customerMobile: '501234567',
            mobileCountryCode: '+965',
            language: 'ar',
            callbackUrl: 'https://diyar.test/orders?payment=callback',
            errorUrl: 'https://diyar.test/orders?payment=callback',
            paymentMethod: 'visa_master',
        ));

        $this->assertSame('KWT-test-session', $payload['SourceOfFund']['SessionId']);
        $this->assertSame('CARD', $payload['PaymentMethod']);
        $this->assertSame(147.20, $payload['Order']['Amount']);
    }
}

class MyFatoorahPaymentResponseMapperTest extends TestCase
{
    #[Test]
    public function it_maps_v3_paid_payment_details(): void
    {
        $mapper = new MyFatoorahPaymentResponseMapper;

        $data = (object) [
            'Invoice' => (object) [
                'Status' => 'PAID',
                'ExternalIdentifier' => 'DYR-20260817-000001',
                'Value' => 147.20,
                'Currency' => 'SAR',
                'Id' => 12345,
            ],
            'Transaction' => (object) [
                'Status' => 'SUCCESS',
                'PaymentId' => '07076945628364902373',
            ],
        ];

        $result = $mapper->mapPaymentDetails($data, 'DYR-20260817-000001', '147.20', 'SAR');

        $this->assertSame(PaymentStatus::Paid, $result->status);
        $this->assertSame('147.20', $result->amount);
        $this->assertSame('07076945628364902373', $result->gatewayPaymentId);
    }
}

class MyFatoorahPaymentMethodMapperTest extends TestCase
{
    #[Test]
    public function it_maps_gateway_objects_to_diyar_capabilities(): void
    {
        $mapper = new MyFatoorahPaymentMethodMapper;

        $methods = $mapper->mapCheckoutGateways([
            'all' => [
                (object) ['PaymentMethodCode' => 'md', 'PaymentMethodEn' => 'Mada'],
                (object) ['PaymentMethodCode' => 'ap', 'PaymentMethodEn' => 'Apple Pay'],
            ],
        ]);

        $this->assertSame('mada', $methods[0]->code);
        $this->assertTrue($methods[0]->available);
        $this->assertSame('apple_pay', $methods[1]->code);
    }
}

class MyFatoorahWebhookMapperTest extends TestCase
{
    #[Test]
    public function it_maps_v2_webhook_payload_to_internal_fields(): void
    {
        $mapper = new MyFatoorahWebhookMapper;

        $mapped = $mapper->map([
            'Event' => ['Code' => 1, 'Name' => 'PaymentStatusChanged'],
            'Data' => [
                'Invoice' => [
                    'Id' => 6409988,
                    'Status' => 'PAID',
                    'ExternalIdentifier' => 'DYR-20260817-000001',
                ],
                'Transaction' => [
                    'Status' => 'SUCCESS',
                    'PaymentId' => '07076409988323998875',
                ],
            ],
        ], 'v2');

        $this->assertSame('DYR-20260817-000001', $mapped->paymentReference);
        $this->assertSame('07076409988323998875', $mapped->gatewayPaymentId);
        $this->assertSame('6409988', $mapped->gatewayInvoiceId);
    }
}
