<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Enums\PaymentStatus;
use App\Services\Payments\DTO\PaymentDetailsResult;
use App\Services\Payments\Exceptions\PaymentGatewayException;

final class MyFatoorahPaymentResponseMapper
{
    public function mapPaymentDetails(object $data, string $expectedReference, string $expectedAmount, string $expectedCurrency): PaymentDetailsResult
    {
        $invoice = $data->Invoice ?? null;
        $transaction = $data->Transaction ?? null;

        if ($invoice === null) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.invalid_gateway_response'));
        }

        $reference = (string) ($invoice->ExternalIdentifier ?? $invoice->CustomerReference ?? '');
        $amount = $this->normalizeAmount($invoice->Value ?? $invoice->Amount ?? null);
        $currency = (string) ($invoice->Currency ?? $invoice->CurrencyIso ?? $expectedCurrency);
        $gatewayPaymentId = isset($transaction->PaymentId) ? (string) $transaction->PaymentId : null;
        $gatewayInvoiceId = isset($invoice->Id) ? (string) $invoice->Id : null;

        if ($reference !== '' && $reference !== $expectedReference) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.reference_mismatch'));
        }

        if ($amount !== null && bccomp($amount, $expectedAmount, 2) !== 0) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.amount_mismatch'));
        }

        if ($currency !== '' && strtoupper($currency) !== strtoupper($expectedCurrency)) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.currency_mismatch'));
        }

        $invoiceStatus = strtoupper((string) ($invoice->Status ?? ''));
        $transactionStatus = strtoupper((string) ($transaction->Status ?? ''));

        return new PaymentDetailsResult(
            status: $this->mapStatus($invoiceStatus, $transactionStatus),
            amount: $amount ?? $expectedAmount,
            currency: $currency !== '' ? $currency : $expectedCurrency,
            paymentReference: $reference !== '' ? $reference : $expectedReference,
            gatewayPaymentId: $gatewayPaymentId,
            gatewayInvoiceId: $gatewayInvoiceId,
            failureReason: $this->mapFailureReason($invoice, $transaction),
        );
    }

    public function mapLegacyPaymentStatus(object $data): PaymentStatus
    {
        return match (strtolower((string) ($data->InvoiceStatus ?? 'pending'))) {
            'paid', 'duplicatepayment' => PaymentStatus::Paid,
            'failed' => PaymentStatus::Failed,
            'expired' => PaymentStatus::Failed,
            default => PaymentStatus::Pending,
        };
    }

    private function mapStatus(string $invoiceStatus, string $transactionStatus): PaymentStatus
    {
        if ($invoiceStatus === 'PAID' || $transactionStatus === 'SUCCESS') {
            return PaymentStatus::Paid;
        }

        if ($invoiceStatus === 'EXPIRED' || $transactionStatus === 'EXPIRED') {
            return PaymentStatus::Expired;
        }

        if (in_array($invoiceStatus, ['CANCELED', 'CANCELLED'], true)
            || in_array($transactionStatus, ['CANCELED', 'CANCELLED'], true)) {
            return PaymentStatus::Cancelled;
        }

        if ($invoiceStatus === 'FAILED' || in_array($transactionStatus, ['FAILED'], true)) {
            return PaymentStatus::Failed;
        }

        return PaymentStatus::Pending;
    }

    private function mapFailureReason(object $invoice, ?object $transaction): ?string
    {
        $reason = $transaction->Error ?? $invoice->Error ?? $invoice->InvoiceError ?? null;

        return is_string($reason) && $reason !== '' ? $reason : null;
    }

    private function normalizeAmount(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return number_format((float) $value, 2, '.', '');
    }
}
