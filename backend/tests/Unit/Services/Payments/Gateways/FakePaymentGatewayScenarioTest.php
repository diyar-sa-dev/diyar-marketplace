<?php

namespace Tests\Unit\Services\Payments\Gateways;

use App\Enums\FakePaymentScenario;
use App\Enums\PaymentStatus;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\Gateways\FakePaymentGateway;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FakePaymentGatewayScenarioTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakePaymentGateway::reset();
        config(['diyar.payments.fake_scenario' => 'success']);
    }

    #[Test]
    public function success_scenario_returns_paid_details(): void
    {
        $gateway = new FakePaymentGateway;
        $details = $gateway->getPaymentDetails(new PaymentDetailsRequest(
            gatewayPaymentId: 'fake-payment-REF1',
            expectedReference: 'REF1',
            expectedAmount: '100.00',
            expectedCurrency: 'SAR',
        ));

        $this->assertSame(PaymentStatus::Paid, $details->status);
    }

    #[Test]
    public function fail_scenario_returns_failed_details(): void
    {
        FakePaymentGateway::setScenarioForReference('REF-FAIL', FakePaymentScenario::Fail);
        $gateway = new FakePaymentGateway;

        $details = $gateway->getPaymentDetails(new PaymentDetailsRequest(
            gatewayPaymentId: 'fake-payment-REF-FAIL',
            expectedReference: 'REF-FAIL',
            expectedAmount: '50.00',
            expectedCurrency: 'SAR',
        ));

        $this->assertSame(PaymentStatus::Failed, $details->status);
    }

    #[Test]
    public function unknown_scenario_returns_unknown_not_failed(): void
    {
        FakePaymentGateway::setScenarioForReference('REF-UNK', FakePaymentScenario::UnknownResult);
        $gateway = new FakePaymentGateway;

        $details = $gateway->getPaymentDetails(new PaymentDetailsRequest(
            gatewayPaymentId: 'fake-payment-REF-UNK',
            expectedReference: 'REF-UNK',
            expectedAmount: '50.00',
            expectedCurrency: 'SAR',
        ));

        $this->assertSame(PaymentStatus::Unknown, $details->status);
    }

    #[Test]
    public function timeout_scenario_throws_gateway_exception(): void
    {
        FakePaymentGateway::setScenarioForReference('REF-TMO', FakePaymentScenario::Timeout);
        $gateway = new FakePaymentGateway;

        $this->expectException(PaymentGatewayException::class);
        $gateway->createSession(new \App\Services\Payments\DTO\PaymentSessionRequest(
            paymentReference: 'REF-TMO',
            orderNumber: 'ORD-1',
            amount: '10.00',
            currency: 'SAR',
            customerName: 'Test',
            customerEmail: 'test@example.com',
            customerMobile: '500000000',
            mobileCountryCode: '+966',
            language: 'en',
            callbackUrl: 'https://example.test/callback',
            errorUrl: 'https://example.test/error',
        ));
    }
}
