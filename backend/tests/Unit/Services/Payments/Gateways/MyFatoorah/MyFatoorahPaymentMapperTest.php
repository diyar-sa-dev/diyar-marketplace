<?php

namespace Tests\Unit\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentMapper;
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
