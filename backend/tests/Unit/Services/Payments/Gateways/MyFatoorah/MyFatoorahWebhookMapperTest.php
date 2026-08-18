<?php

namespace Tests\Unit\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookMapper;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

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
