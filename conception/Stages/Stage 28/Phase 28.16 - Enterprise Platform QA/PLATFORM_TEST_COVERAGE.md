# Platform Test Coverage Certification

**Phase:** 28.16 | **Status:** Partial — see gaps

## Summary

| Suite | Tests | Last verified | CI |
|-------|------:|:-------------:|:--:|
| PHPUnit | ~775 | prior 774/774 | ✓ |
| Vitest | 128 | prior 128/128 | ✓ |
| Playwright | ~72 | stale | ✓ |
| Redis integration | 6 | not fresh | ✓ (added 28.16) |

## Role coverage

| Role | API | E2E |
|------|:---:|:---:|
| Guest | ✓ | ✓ |
| Customer | ✓ | partial |
| Vendor | ✓ | ✓ |
| Provider | ✓ | ✓ |
| Affiliate | ✓ | ✗ |
| Admin | ✓ | ✓ |

## Critical gaps

- Commerce checkout E2E
- Permission matrix automation
- Reverb/WebSocket
- Queue worker integration

**Detail:** [TEST_COVERAGE_MATRIX.md](./TEST_COVERAGE_MATRIX.md) | [KNOWN_TEST_GAPS.md](./KNOWN_TEST_GAPS.md)
