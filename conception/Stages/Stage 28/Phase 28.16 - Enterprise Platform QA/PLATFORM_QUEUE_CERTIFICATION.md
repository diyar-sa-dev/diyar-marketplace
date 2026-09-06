# Platform Queue Certification

**Phase:** 28.16 | **Status:** NOT VERIFIED (live workers)

## Current state

- Jobs tested with `Queue::fake()` and sync driver in PHPUnit/E2E
- Redis queue configured in production
- **No** worker-process integration test
- **No** backlog drain measurement (100/1k/5k jobs)

## Required before cert

- Dispatch notification job → worker processes → DB assertion
- Retry/backoff on failure
- Idempotent job handling
- Queue depth under load

## Score: 4/10

**Detail:** [KNOWN_TEST_GAPS.md](./KNOWN_TEST_GAPS.md) G3
