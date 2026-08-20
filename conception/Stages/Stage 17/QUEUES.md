# Queues

Stage 17 reuses Stage 16 queue names and workers.

## Synchronous (never queued)

- Message persistence
- Attachment record creation
- Conversation participant updates

## Asynchronous (queued via Stage 16)

- Notification delivery triggered by `MessageCreated` → `DispatchNotificationListener`
- Email/push/in-app channel jobs on `notifications-high`, `notifications`, `notifications-low`

## Chat-specific queues

Not introduced unless load requires it. Chat side effects piggyback on existing notification priority strategy.

## Failure isolation

Notification channel failure must not fail `POST /messages`. Circuit breaker from Stage 16 applies to external providers (FCM, email).
