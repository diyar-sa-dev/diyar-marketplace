# Phase 13.5 — Notification Preferences

> **Status:** Implemented (email channel functional; push/SMS UI only)

## Preference shape

```json
{
  "preferences": {
    "locale": "ar",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "orders": true,
      "promotions": false,
      "system": true
    }
  }
}
```

## Backend

- `UserNotificationPreferences::emailEnabled()` — default `true` if unset
- `WelcomeEmailService` skips send when email notifications disabled
- Profile `PATCH` merges `preferences` via `ProfileService`

## Frontend

- `notificationPreferences.ts` — read/merge helpers
- `NotificationSettingsPage` — persists toggles on change
- Vendor settings → notifications tab — email channel + locale save

## Deferred

- Push/SMS provider delivery
- Per-type notification routing (orders/promotions) — UI stored, not dispatched yet
