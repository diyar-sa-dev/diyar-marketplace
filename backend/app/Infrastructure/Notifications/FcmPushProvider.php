<?php

namespace App\Infrastructure\Notifications;

use App\Contracts\Notifications\PushProviderInterface;
use App\Models\NotificationDevice;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class FcmPushProvider implements PushProviderInterface
{
    public function send(User $recipient, UserNotification $notification, array $devices, array $payload): PushSendResult
    {
        $projectId = config('diyar.notifications.push.fcm.project_id');
        $credentialsPath = config('diyar.notifications.push.fcm.credentials');

        if (! is_string($projectId) || $projectId === '' || ! is_string($credentialsPath) || $credentialsPath === '') {
            throw new PushProviderException('FCM is not configured.', permanent: true);
        }

        if (! is_file($credentialsPath)) {
            throw new PushProviderException('FCM credentials file is missing.', permanent: true);
        }

        $credentials = json_decode((string) file_get_contents($credentialsPath), true);
        if (! is_array($credentials)) {
            throw new PushProviderException('FCM credentials file is invalid.', permanent: true);
        }

        $accessToken = $this->accessToken($credentials);
        $invalidDeviceIds = [];
        $rateLimited = false;

        foreach ($devices as $device) {
            if (! $device instanceof NotificationDevice) {
                continue;
            }

            if (! in_array($device->platform, ['android', 'web'], true)) {
                continue;
            }

            $response = Http::withToken($accessToken)
                ->acceptJson()
                ->connectTimeout(5)
                ->timeout(15)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                    'message' => [
                        'token' => $device->token,
                        'notification' => [
                            'title' => $notification->title,
                            'body' => $notification->body,
                        ],
                        'data' => [
                            'notification_id' => $notification->id,
                            'type' => $notification->type->value,
                            'entity_type' => (string) ($notification->entity_type ?? ''),
                            'entity_id' => (string) ($notification->entity_id ?? ''),
                        ],
                    ],
                ]);

            if ($response->status() === 429) {
                $rateLimited = true;
                throw new PushProviderException('FCM rate limited.', rateLimited: true);
            }

            if ($response->successful()) {
                continue;
            }

            $errorCode = (string) data_get($response->json(), 'error.details.0.errorCode', '');
            $reason = (string) data_get($response->json(), 'error.status', '');

            if ($this->isInvalidToken($errorCode, $reason, $response->body())) {
                $invalidDeviceIds[] = $device->id;
                Log::info('notifications.push.invalid_token', [
                    'device_id' => $device->id,
                    'user_id' => $recipient->id,
                ]);

                continue;
            }

            throw new PushProviderException(
                'FCM delivery failed: '.$response->body(),
                permanent: $response->clientError(),
            );
        }

        return new PushSendResult(invalidDeviceIds: $invalidDeviceIds, rateLimited: $rateLimited);
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function accessToken(array $credentials): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claimSet = $this->base64UrlEncode(json_encode([
            'iss' => $credentials['client_email'] ?? '',
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $privateKey = openssl_pkey_get_private((string) ($credentials['private_key'] ?? ''));
        if ($privateKey === false) {
            throw new PushProviderException('FCM private key is invalid.', permanent: true);
        }

        $unsigned = $header.'.'.$claimSet;
        $signature = '';
        openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $jwt = $unsigned.'.'.$this->base64UrlEncode($signature);

        $response = Http::asForm()
            ->connectTimeout(5)
            ->timeout(10)
            ->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            throw new PushProviderException('Unable to obtain FCM access token.');
        }

        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            throw new PushProviderException('FCM access token response was invalid.');
        }

        return $token;
    }

    private function isInvalidToken(string $errorCode, string $reason, string $body): bool
    {
        $haystack = strtolower($errorCode.' '.$reason.' '.$body);

        return str_contains($haystack, 'unregistered')
            || str_contains($haystack, 'invalid_argument')
            || str_contains($haystack, 'not_found')
            || str_contains($haystack, 'invalid registration');
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
