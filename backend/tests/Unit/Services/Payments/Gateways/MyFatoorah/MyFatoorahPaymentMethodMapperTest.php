<?php

namespace Tests\Unit\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahPaymentMethodMapper;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

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
