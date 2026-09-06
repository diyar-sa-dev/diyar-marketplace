<?php

namespace Tests\Unit\Services\Payments;

use App\Enums\PaymentMethod;
use App\Services\Payments\DTO\PaymentMethodCapability;
use App\Services\Payments\PaymentMethodResolver;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaymentMethodResolverTest extends TestCase
{
    #[Test]
    public function it_presents_canonical_checkout_methods(): void
    {
        $resolver = new PaymentMethodResolver;

        $presented = $resolver->presentCheckoutMethods([
            new PaymentMethodCapability(code: 'mada', available: true, label: 'Mada'),
            new PaymentMethodCapability(code: 'card', available: true, label: 'Card'),
            new PaymentMethodCapability(code: 'apple_pay', available: false, label: 'Apple Pay'),
            new PaymentMethodCapability(code: 'tabby', available: true, label: 'Tabby'),
        ]);

        $this->assertSame('mada', $presented[0]['code']);
        $this->assertTrue($presented[0]['available']);
        $this->assertSame('card', $presented[1]['code']);
        $this->assertTrue($presented[1]['available']);
        $this->assertSame('apple_pay', $presented[2]['code']);
        $this->assertFalse($presented[2]['available']);
        $this->assertSame('tabby', $presented[3]['code']);
        $this->assertTrue($presented[3]['available']);
    }

    #[Test]
    public function it_parses_legacy_gateway_codes(): void
    {
        $resolver = new PaymentMethodResolver;

        $this->assertSame(PaymentMethod::Card, PaymentMethod::tryFromLegacy('visa'));
        $this->assertSame(PaymentMethod::ApplePay, PaymentMethod::tryFromLegacy('apple'));
        $this->assertSame(PaymentMethod::Mada, PaymentMethod::tryFromLegacy('md'));
    }

    #[Test]
    public function it_resolves_gateway_code_for_canonical_method(): void
    {
        $resolver = new PaymentMethodResolver;

        $gatewayCode = $resolver->resolveGatewayCode(PaymentMethod::Card, [
            new PaymentMethodCapability(code: 'visa_master', available: true, label: 'Visa/Mastercard'),
        ]);

        $this->assertSame('visa_master', $gatewayCode);
    }
}
