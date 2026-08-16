<?php

namespace App\Infrastructure\Sms;

use App\Contracts\Sms\SmsProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * MSEGAT SMS delivery adapter.
 *
 * DIYAR generates OTP codes internally and verifies them via cache.
 * This adapter delivers the OTP message using MSEGAT HTTPS JSON APIs.
 *
 * @see https://msegat.docs.apiary.io/
 * @see https://www.msegat.com/gw/sendOTPCode.php (provider OTP product — reference only)
 */
final class MsegatSmsProvider implements SmsProvider
{
    public function __construct(
        private readonly string $username,
        private readonly string $apiKey,
        private readonly string $senderId,
        private readonly string $lang,
        private readonly string $baseUrl,
    ) {}

    public function send(string $phone, string $message): void
    {
        $response = Http::asJson()
            ->timeout(15)
            ->post(rtrim($this->baseUrl, '/').'/sendsms.php', [
                'userName' => $this->username,
                'apiKey' => $this->apiKey,
                'userSender' => $this->senderId,
                'numbers' => $phone,
                'msg' => $message,
                'msgEncoding' => 'UTF8',
                'lang' => $this->lang,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('SMS provider request failed.');
        }

        $body = trim((string) $response->body());

        if ($body === '' || str_starts_with($body, 'ERROR')) {
            throw new RuntimeException('SMS provider rejected the request.');
        }

        if (str_starts_with($body, '1')) {
            return;
        }

        $json = $response->json();
        if (is_array($json) && (($json['code'] ?? null) === '1' || ($json['response']['code'] ?? null) === '1')) {
            return;
        }
    }
}
