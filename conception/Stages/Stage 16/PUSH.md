# Push Notifications

## Provider architecture

```
PushNotificationChannel
    └── PushProviderInterface
            └── CompositePushProvider
                    ├── FcmPushProvider (android, web)
                    ├── ApnsPushProvider (ios — stub until credentials configured)
                    └── LogPushProvider (local/dev)
```

## Configuration

```
DIYAR_PUSH_DRIVER=log        # log | fcm | apns | multi
DIYAR_FCM_PROJECT_ID=
DIYAR_FCM_CREDENTIALS=/path/to/service-account.json
DIYAR_APNS_KEY_ID=
DIYAR_APNS_TEAM_ID=
DIYAR_APNS_BUNDLE_ID=
DIYAR_APNS_PRIVATE_KEY=
DIYAR_APNS_ENVIRONMENT=sandbox
```

**Never commit** credentials or full device tokens to logs.

## Device registration

`POST /api/v1/profile/notifications/devices`

```json
{
  "token": "...",
  "platform": "web|ios|android",
  "device_identifier": "optional"
}
```

Rate limit: 20/min per user.

## Invalid tokens

FCM `UNREGISTERED` / invalid responses → device deactivated via `NotificationDeviceService::deactivateByIds()`.

Permanent failures do not retry indefinitely.

## Circuit breaker

Push failures increment `NotificationCircuitBreaker` for provider key `push`. When open, push delivery throws without blocking in-app or realtime.

## Queue

Push is **always queued** via `DeliverNotificationChannelJob` — never synchronous HTTP to FCM from request cycle.
