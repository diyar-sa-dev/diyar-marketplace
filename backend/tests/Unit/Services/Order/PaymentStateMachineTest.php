<?php

namespace Tests\Unit\Services\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentStateTransition;
use App\Services\Order\PaymentStateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PaymentStateMachineTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function it_records_audit_trail_on_transition(): void
    {
        $payment = $this->createPayment(PaymentStatus::Pending);

        app(PaymentStateService::class)->transition(
            $payment,
            PaymentStatus::Processing,
            source: 'test',
            correlationId: 'corr-1',
        );

        $this->assertDatabaseHas('payment_state_transitions', [
            'payment_id' => $payment->id,
            'from_status' => 'pending',
            'to_status' => 'processing',
            'source' => 'test',
            'correlation_id' => 'corr-1',
        ]);
    }

    #[Test]
    public function it_rejects_invalid_backward_transition(): void
    {
        $payment = $this->createPayment(PaymentStatus::Paid);

        $this->expectException(InvalidArgumentException::class);

        app(PaymentStateService::class)->transition($payment, PaymentStatus::Pending);
    }

    #[Test]
    public function it_allows_unknown_to_be_resolved_by_reconciliation(): void
    {
        $payment = $this->createPayment(PaymentStatus::Unknown);

        $updated = app(PaymentStateService::class)->transition(
            $payment,
            PaymentStatus::Paid,
            source: 'reconciliation',
        );

        $this->assertSame(PaymentStatus::Paid, $updated->status);
        $this->assertSame(1, PaymentStateTransition::query()->where('payment_id', $payment->id)->count());
    }

    private function createPayment(PaymentStatus $status): Payment
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($user);
        $order = Order::query()->create([
            'user_id' => $user->id,
            'order_number' => 'DYR-TEST-'.random_int(1000, 9999),
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => 'Test',
            'shipping_phone' => '0500000000',
            'shipping_city' => 'Riyadh',
            'shipping_district' => 'District',
            'shipping_street' => 'Street',
            'subtotal' => '100.00',
            'shipping_total' => '0.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '0.00',
            'grand_total' => '100.00',
            'idempotency_key' => (string) Str::uuid(),
            'idempotency_payload_hash' => hash('sha256', 'test'),
        ]);

        return Payment::query()->create([
            'order_id' => $order->id,
            'status' => $status,
            'amount' => '100.00',
            'currency' => 'SAR',
            'payment_reference' => $order->order_number,
            'gateway' => 'myfatoorah',
        ]);
    }
}
