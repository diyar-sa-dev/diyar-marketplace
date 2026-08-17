<?php

namespace Tests\Unit\Payments;

use App\Enums\PaymentStatus;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentResponseMapper;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MyFatoorahPaymentResponseMapperTest extends TestCase
{
    #[Test]
    public function it_rejects_gateway_amount_mismatch(): void
    {
        $mapper = new MyFatoorahPaymentResponseMapper;

        $data = (object) [
            'Invoice' => (object) [
                'ExternalIdentifier' => 'DYR-TEST-001',
                'Value' => 50.00,
                'Currency' => 'SAR',
                'Status' => 'PAID',
                'Id' => '1001',
            ],
            'Transaction' => (object) [
                'PaymentId' => '07076945628364902373',
                'Status' => 'SUCCESS',
            ],
        ];

        $this->expectException(PaymentGatewayException::class);

        $mapper->mapPaymentDetails($data, 'DYR-TEST-001', '100.00', 'SAR');
    }

    #[Test]
    public function it_rejects_gateway_currency_mismatch(): void
    {
        $mapper = new MyFatoorahPaymentResponseMapper;

        $data = (object) [
            'Invoice' => (object) [
                'ExternalIdentifier' => 'DYR-TEST-001',
                'Value' => 100.00,
                'Currency' => 'USD',
                'Status' => 'PAID',
                'Id' => '1001',
            ],
            'Transaction' => (object) [
                'PaymentId' => '07076945628364902373',
                'Status' => 'SUCCESS',
            ],
        ];

        $this->expectException(PaymentGatewayException::class);

        $mapper->mapPaymentDetails($data, 'DYR-TEST-001', '100.00', 'SAR');
    }

    #[Test]
    public function it_maps_paid_status_when_gateway_matches(): void
    {
        $mapper = new MyFatoorahPaymentResponseMapper;

        $data = (object) [
            'Invoice' => (object) [
                'ExternalIdentifier' => 'DYR-TEST-001',
                'Value' => 100.00,
                'Currency' => 'SAR',
                'Status' => 'PAID',
                'Id' => '1001',
            ],
            'Transaction' => (object) [
                'PaymentId' => '07076945628364902373',
                'Status' => 'SUCCESS',
            ],
        ];

        $result = $mapper->mapPaymentDetails($data, 'DYR-TEST-001', '100.00', 'SAR');

        $this->assertSame(PaymentStatus::Paid, $result->status);
        $this->assertSame('100.00', $result->amount);
        $this->assertSame('SAR', $result->currency);
    }
}
