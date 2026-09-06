# Mail Configuration

## Environment variables

```env
MAIL_MAILER=log          # dev default; use smtp/resend/postmark in prod
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="DIYAR"
```

**Never commit credentials.** Document keys in `.env.example` comments only.

## Supported mailers (Laravel)

- `smtp` — generic SMTP
- `resend` — Resend API
- `postmark` — Postmark
- `mailgun` — Mailgun
- `ses` — Amazon SES
- `log` / `array` — development and tests

## Verification

```bash
php artisan mail:test ops@yourdomain.com
```

Uses configured default mailer. Reports mailer name and from address; does not log passwords.

## Production checklist

- [ ] `MAIL_MAILER` set to production provider
- [ ] From domain matches SPF/DKIM/DMARC records
- [ ] TLS enabled for SMTP
- [ ] Queue workers processing mail jobs
- [ ] Test delivery to real inbox
- [ ] Bounce/invalid recipient classified as permanent failure (no blind retry)

## Email templates

Notifications use `NotificationRenderer` + `diyar.notifications.*` lang keys. Broadcasts pass explicit `title`/`body` in payload.

Layouts: existing Laravel markdown/HTML mail channel — reusable template consolidation deferred.

## DNS (operations)

Verify with your provider:

- SPF record authorizes sending IP/domain
- DKIM signing enabled
- DMARC policy published (start with `p=none`, tighten after monitoring)
