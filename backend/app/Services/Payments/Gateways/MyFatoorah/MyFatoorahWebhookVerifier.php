<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use MyFatoorah\Library\MyFatoorah;

final class MyFatoorahWebhookVerifier
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function verify(array $payload, string $signature, string $webhookVersion, string $secretKey): bool
    {
        if ($secretKey === '') {
            throw PaymentGatewayException::configuration(__('diyar.payment.webhook_not_configured'));
        }

        $version = strtolower($webhookVersion);

        return match ($version) {
            'v1' => $this->verifyV1($payload, $signature, $secretKey),
            'v2' => $this->verifyV2($payload, $signature, $secretKey),
            default => false,
        };
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function verifyV1(array $payload, string $signature, string $secretKey): bool
    {
        if (! isset($payload['EventType'], $payload['Data'])) {
            return false;
        }

        return MyFatoorah::isSignatureValid(
            $payload['Data'],
            $secretKey,
            $signature,
            $payload['EventType'],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function verifyV2(array $payload, string $signature, string $secretKey): bool
    {
        if (! isset($payload['Event']['Code'], $payload['Data'])) {
            return false;
        }

        $dataModel = $this->buildV2DataModel((int) $payload['Event']['Code'], $payload['Data']);

        if ($dataModel === null) {
            return false;
        }

        return $this->checkSignature($dataModel, $secretKey, $signature);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>|null
     */
    private function buildV2DataModel(int $code, array $data): ?array
    {
        return match ($code) {
            1 => [
                'Invoice.Id' => $data['Invoice']['Id'] ?? '',
                'Invoice.Status' => $data['Invoice']['Status'] ?? '',
                'Transaction.Status' => $data['Transaction']['Status'] ?? '',
                'Transaction.PaymentId' => $data['Transaction']['PaymentId'] ?? '',
                'Invoice.ExternalIdentifier' => $data['Invoice']['ExternalIdentifier'] ?? '',
            ],
            2 => [
                'Refund.Id' => $data['Refund']['Id'] ?? '',
                'Refund.Status' => $data['Refund']['Status'] ?? '',
                'Amount.ValueInBaseCurrency' => $data['Amount']['ValueInBaseCurrency'] ?? '',
                'ReferencedInvoice.Id' => $data['ReferencedInvoice']['Id'] ?? '',
            ],
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $dataModel
     */
    private function checkSignature(array $dataModel, string $secretKey, string $signature): bool
    {
        $outputArr = [];

        foreach ($dataModel as $key => $value) {
            $outputArr[] = sprintf('%s=%s', $key, $value);
        }

        $output = implode(',', $outputArr);
        $hash = base64_encode(hash_hmac('sha256', $output, $secretKey, true));

        return hash_equals($hash, $signature);
    }
}
