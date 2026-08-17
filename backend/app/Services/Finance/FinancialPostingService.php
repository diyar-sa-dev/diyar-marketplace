<?php

namespace App\Services\Finance;

use App\Enums\BalanceBucket;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Enums\PaymentStatus;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\PaymentVendorAllocation;
use App\Models\Refund;
use App\Models\User;
use App\Models\VendorPayout;
use App\Services\Payments\PaymentAllocationSnapshotService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class FinancialPostingService
{
    public function __construct(
        private readonly PaymentAllocationSnapshotService $allocations,
        private readonly FinancialReferenceService $references,
    ) {}

    public function postPaidPayment(Payment $payment): void
    {
        if ($payment->status !== PaymentStatus::Paid) {
            throw new InvalidArgumentException(__('diyar.finance.payment_not_paid'));
        }

        $payment = Payment::query()
            ->with(['vendorAllocations', 'order'])
            ->findOrFail($payment->id);

        $this->allocations->assertAllocationsMatchPayment($payment);

        DB::transaction(function () use ($payment) {
            foreach ($payment->vendorAllocations as $allocation) {
                $this->postAllocationEntries($payment, $allocation);
            }
        });
    }

    public function postEscrowRelease(PaymentVendorAllocation $allocation): void
    {
        $this->assertAllocationIntegrity($allocation);

        $amount = number_format((float) $allocation->vendor_payable_amount, 2, '.', '');
        $payment = $allocation->payment;

        $this->createIfNotExists(
            type: FinancialTransactionType::EscrowRelease,
            sourceType: 'payment_vendor_allocation_release',
            sourceId: $allocation->id,
            bucket: BalanceBucket::VendorEscrow,
            direction: FinancialDirection::Debit,
            amount: $amount,
            currency: $allocation->currency,
            vendorAccountId: $allocation->vendor_account_id,
            payment: $payment,
            allocation: $allocation,
            description: __('diyar.finance.escrow_release_debit'),
            metadata: ['vendor_order_id' => $allocation->vendor_order_id],
        );

        $this->createIfNotExists(
            type: FinancialTransactionType::EscrowRelease,
            sourceType: 'payment_vendor_allocation_release',
            sourceId: $allocation->id,
            bucket: BalanceBucket::VendorAvailable,
            direction: FinancialDirection::Credit,
            amount: $amount,
            currency: $allocation->currency,
            vendorAccountId: $allocation->vendor_account_id,
            payment: $payment,
            allocation: $allocation,
            description: __('diyar.finance.escrow_release_credit'),
            metadata: ['vendor_order_id' => $allocation->vendor_order_id],
        );
    }

    public function postPayoutDebit(VendorPayout $payout): FinancialTransaction
    {
        return $this->createIfNotExists(
            type: FinancialTransactionType::Payout,
            sourceType: 'vendor_payout',
            sourceId: $payout->id,
            bucket: BalanceBucket::VendorAvailable,
            direction: FinancialDirection::Debit,
            amount: number_format((float) $payout->amount, 2, '.', ''),
            currency: $payout->currency,
            vendorAccountId: $payout->vendor_account_id,
            payment: null,
            allocation: null,
            description: __('diyar.finance.payout_debit'),
            metadata: ['payout_reference' => $payout->reference],
            vendorPayoutId: $payout->id,
        );
    }

    private function postAllocationEntries(Payment $payment, PaymentVendorAllocation $allocation): void
    {
        $this->assertAllocationIntegrity($allocation);

        $this->createIfNotExists(
            type: FinancialTransactionType::Escrow,
            sourceType: 'payment_vendor_allocation',
            sourceId: $allocation->id,
            bucket: BalanceBucket::VendorEscrow,
            direction: FinancialDirection::Credit,
            amount: (string) $allocation->vendor_payable_amount,
            currency: $allocation->currency,
            vendorAccountId: $allocation->vendor_account_id,
            payment: $payment,
            allocation: $allocation,
            description: __('diyar.finance.escrow_credit'),
            metadata: [
                'vendor_gross_total' => (string) $allocation->vendor_gross_total,
                'platform_commission_amount' => (string) $allocation->platform_commission_amount,
            ],
        );

        if (bccomp((string) $allocation->platform_commission_amount, '0.00', 2) > 0) {
            $this->createIfNotExists(
                type: FinancialTransactionType::PlatformCommission,
                sourceType: 'payment_vendor_allocation',
                sourceId: $allocation->id,
                bucket: BalanceBucket::PlatformCommission,
                direction: FinancialDirection::Credit,
                amount: (string) $allocation->platform_commission_amount,
                currency: $allocation->currency,
                vendorAccountId: null,
                payment: $payment,
                allocation: $allocation,
                description: __('diyar.finance.platform_commission'),
                metadata: [
                    'vendor_account_id' => $allocation->vendor_account_id,
                ],
            );
        }

        $this->createIfNotExists(
            type: FinancialTransactionType::Sale,
            sourceType: 'payment_vendor_allocation',
            sourceId: $allocation->id,
            bucket: BalanceBucket::PlatformCash,
            direction: FinancialDirection::Credit,
            amount: (string) $allocation->vendor_gross_total,
            currency: $allocation->currency,
            vendorAccountId: null,
            payment: $payment,
            allocation: $allocation,
            description: __('diyar.finance.sale_recorded'),
            metadata: [
                'vendor_account_id' => $allocation->vendor_account_id,
            ],
        );
    }

    public function postAdjustment(
        string $vendorAccountId,
        string $amount,
        string $currency,
        FinancialDirection $direction,
        BalanceBucket $bucket,
        User $admin,
        string $reason,
    ): FinancialTransaction {
        return DB::transaction(function () use ($vendorAccountId, $amount, $currency, $direction, $bucket, $admin, $reason) {
            $sourceId = (string) str()->uuid();

            return $this->createIfNotExists(
                type: FinancialTransactionType::Adjustment,
                sourceType: 'admin_adjustment',
                sourceId: $sourceId,
                bucket: $bucket,
                direction: $direction,
                amount: $amount,
                currency: $currency,
                vendorAccountId: $vendorAccountId,
                payment: null,
                allocation: null,
                description: $reason,
                metadata: ['reason' => $reason],
                createdBy: $admin->id,
            );
        });
    }

    public function postRefund(Refund $refund): void
    {
        $refund->loadMissing(['allocation', 'payment', 'vendorOrder']);

        $allocation = $refund->allocation;

        if ($allocation === null) {
            throw new InvalidArgumentException(__('diyar.returns.allocation_not_found'));
        }

        $this->assertAllocationIntegrity($allocation);

        $vendorBucket = $this->resolveVendorRefundBucket($allocation);
        $payment = $refund->payment;

        DB::transaction(function () use ($refund, $allocation, $vendorBucket, $payment) {
            $vendorReversal = number_format((float) $refund->vendor_payable_reversal, 2, '.', '');
            $commissionReversal = number_format((float) $refund->commission_reversal, 2, '.', '');
            $grossReversal = number_format((float) $refund->total_amount, 2, '.', '');

            if (bccomp($vendorReversal, '0.00', 2) > 0) {
                $this->createIfNotExists(
                    type: FinancialTransactionType::Refund,
                    sourceType: 'refund',
                    sourceId: $refund->id,
                    bucket: $vendorBucket,
                    direction: FinancialDirection::Debit,
                    amount: $vendorReversal,
                    currency: $refund->currency,
                    vendorAccountId: $allocation->vendor_account_id,
                    payment: $payment,
                    allocation: $allocation,
                    description: __('diyar.finance.refund_vendor_debit'),
                    metadata: [
                        'return_request_id' => $refund->return_request_id,
                        'refund_reference' => $refund->reference,
                    ],
                );
            }

            if (bccomp($commissionReversal, '0.00', 2) > 0) {
                $this->createIfNotExists(
                    type: FinancialTransactionType::Refund,
                    sourceType: 'refund',
                    sourceId: $refund->id,
                    bucket: BalanceBucket::PlatformCommission,
                    direction: FinancialDirection::Debit,
                    amount: $commissionReversal,
                    currency: $refund->currency,
                    vendorAccountId: null,
                    payment: $payment,
                    allocation: $allocation,
                    description: __('diyar.finance.refund_commission_debit'),
                    metadata: [
                        'vendor_account_id' => $allocation->vendor_account_id,
                        'return_request_id' => $refund->return_request_id,
                    ],
                );
            }

            if (bccomp($grossReversal, '0.00', 2) > 0) {
                $this->createIfNotExists(
                    type: FinancialTransactionType::Refund,
                    sourceType: 'refund',
                    sourceId: $refund->id,
                    bucket: BalanceBucket::PlatformCash,
                    direction: FinancialDirection::Debit,
                    amount: $grossReversal,
                    currency: $refund->currency,
                    vendorAccountId: null,
                    payment: $payment,
                    allocation: $allocation,
                    description: __('diyar.finance.refund_sale_debit'),
                    metadata: [
                        'vendor_account_id' => $allocation->vendor_account_id,
                        'return_request_id' => $refund->return_request_id,
                    ],
                );
            }
        });
    }

    private function resolveVendorRefundBucket(PaymentVendorAllocation $allocation): BalanceBucket
    {
        $released = FinancialTransaction::query()
            ->where('source_type', 'payment_vendor_allocation_release')
            ->where('source_id', $allocation->id)
            ->where('transaction_type', FinancialTransactionType::EscrowRelease->value)
            ->where('balance_bucket', BalanceBucket::VendorAvailable->value)
            ->exists();

        return $released ? BalanceBucket::VendorAvailable : BalanceBucket::VendorEscrow;
    }

    private function createIfNotExists(
        FinancialTransactionType $type,
        string $sourceType,
        string $sourceId,
        BalanceBucket $bucket,
        FinancialDirection $direction,
        string $amount,
        string $currency,
        ?string $vendorAccountId,
        ?Payment $payment,
        ?PaymentVendorAllocation $allocation,
        string $description,
        array $metadata = [],
        ?string $createdBy = null,
        ?string $vendorPayoutId = null,
    ): FinancialTransaction {
        $existing = FinancialTransaction::query()
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->where('transaction_type', $type->value)
            ->where('balance_bucket', $bucket->value)
            ->where('direction', $direction->value)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            return FinancialTransaction::query()->create([
                'reference' => $this->references->nextTransactionReference(),
                'transaction_type' => $type,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'vendor_account_id' => $vendorAccountId,
                'order_id' => $payment?->order_id ?? $allocation?->vendorOrder?->order_id,
                'payment_id' => $payment?->id,
                'payment_vendor_allocation_id' => $allocation?->id,
                'vendor_payout_id' => $vendorPayoutId,
                'amount' => $amount,
                'currency' => $currency,
                'direction' => $direction,
                'balance_bucket' => $bucket,
                'description' => $description,
                'metadata' => $metadata,
                'created_by' => $createdBy,
            ]);
        } catch (QueryException $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'financial_transactions_idempotency_unique')) {
                return FinancialTransaction::query()
                    ->where('source_type', $sourceType)
                    ->where('source_id', $sourceId)
                    ->where('transaction_type', $type->value)
                    ->where('balance_bucket', $bucket->value)
                    ->where('direction', $direction->value)
                    ->firstOrFail();
            }

            throw $exception;
        }
    }

    private function assertAllocationIntegrity(PaymentVendorAllocation $allocation): void
    {
        $payable = number_format((float) $allocation->vendor_payable_amount, 2, '.', '');
        $commission = number_format((float) $allocation->platform_commission_amount, 2, '.', '');
        $gross = number_format((float) $allocation->vendor_gross_total, 2, '.', '');
        $expectedGross = bcadd($payable, $commission, 2);

        if (bccomp($expectedGross, $gross, 2) !== 0) {
            throw new InvalidArgumentException(__('diyar.finance.allocation_integrity_failed'));
        }
    }
}
