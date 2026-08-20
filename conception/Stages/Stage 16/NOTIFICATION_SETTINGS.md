# Notification Settings

## Backend registry

Categories defined in `config/diyar.php` → `notifications.categories`:

- orders, payments, bookings, offers, reviews, follows
- products, services, vendor, payouts, system, auth

Each category specifies:

- `label` — i18n key
- `policy` — `optional` or `required_in_app`
- `roles` — which user roles see the category
- `channels` — available channels (`in_app`, `email`, `push`)

## API

### GET `/api/v1/profile/notification-preferences`

Returns:

```json
{
  "categories": [{ "key", "label", "policy", "channels", "channel_policies" }],
  "preferences": { "orders": { "in_app": true, "email": true, "push": false } }
}
```

### PATCH `/api/v1/profile/notification-preferences`

```json
{
  "preferences": {
    "orders": { "email": false }
  }
}
```

Backend enforces locked channels — frontend cannot disable required in-app notifications.

## Storage

User preferences stored at:

```
user.preferences.notifications.matrix.{category}.{channel}
```

Legacy flat keys (`email`, `push`, `orders`) remain supported as fallback in `NotificationPreferenceResolver`.

## Frontend

- Page: `/profile/notification-settings`
- Hook: `useNotificationPreferences`
- UI driven entirely by backend registry (no hardcoded category list)

## Provider / vendor settings

Provider-specific notification toggles remain in the provider portal (`ProviderSettingsController`). Customer/vendor marketplace preferences use the profile API above.
