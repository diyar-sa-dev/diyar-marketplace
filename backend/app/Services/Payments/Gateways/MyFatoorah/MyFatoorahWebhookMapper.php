<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\DTO\VerifiedWebhookPayload;

final class MyFatoorahWebhookMapper
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function map(array $payload, string $webhookVersion): VerifiedWebhookPayload
    {
        $version = strtolower($webhookVersion);

        if ($version === 'v2') {
            return $this->mapV2($payload);
        }

        return $this->mapV1($payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function mapV1(array $payload): VerifiedWebhookPayload
    {
        $data = $payload['Data'] ?? [];

        return new VerifiedWebhookPayload(
            eventType: (string) ($payload['EventType'] ?? 'unknown'),
            webhookVersion: 'v1',
            payload: $payload,
            paymentReference: isset($data['CustomerReference']) ? (string) $data['CustomerReference'] : null,
            gatewayPaymentId: isset($data['PaymentId']) ? (string) $data['PaymentId'] : null,
            gatewayInvoiceId: isset($data['InvoiceId']) ? (string) $data['InvoiceId'] : null,
            transactionStatus: isset($data['TransactionStatus']) ? (string) $data['TransactionStatus'] : null,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function mapV2(array $payload): VerifiedWebhookPayload
    {
        $data = $payload['Data'] ?? [];
        $invoice = $data['Invoice'] ?? [];
        $transaction = $data['Transaction'] ?? [];

        return new VerifiedWebhookPayload(
            eventType: (string) ($payload['Event']['Code'] ?? $payload['Event']['Name'] ?? 'unknown'),
            webhookVersion: 'v2',
            payload: $payload,
            paymentReference: isset($invoice['ExternalIdentifier']) ? (string) $invoice['ExternalIdentifier'] : null,
            gatewayPaymentId: isset($transaction['PaymentId']) ? (string) $transaction['PaymentId'] : null,
            gatewayInvoiceId: isset($invoice['Id']) ? (string) $invoice['Id'] : null,
            transactionStatus: isset($transaction['Status']) ? (string) $transaction['Status'] : null,
        );
    }
}
