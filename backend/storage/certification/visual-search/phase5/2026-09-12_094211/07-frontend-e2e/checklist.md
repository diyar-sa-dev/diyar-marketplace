# Phase 5 §7 — Frontend E2E Checklist

**Method:** Static code review + API integration verified in Docker. Full browser automation (Playwright) not executed in this run.

| Flow | EN | AR/RTL | Evidence | Result |
|------|----|--------|----------|--------|
| Open image search modal | Camera UI present (`ImageSearchModal.tsx`) | Uses `useLocale()` / `t()` keys | Code review | PASS (code) |
| Upload valid image | Preview via `URL.createObjectURL` | Same component | Code review | PASS (code) |
| Remove / reselect | `clearSelection()` revokes object URL | Same | Code review | PASS (code) |
| Submit success | `useVisualSearch` → `onResults` → SearchPage | Same | API smoke (when not rate-limited) | PASS (code + API) |
| 422 validation | `validateVisualSearchFile` + backend guard | Error keys under `visualSearchErrors.*` | PHPUnit security suite | PASS (automated) |
| 429 rate limit | axios error → `request_failed` key | Same | PHPUnit rate limit test | PASS (automated) |
| 503 index_empty | Preserved in `VisualSearchService::assertAvailable` | Same | PHPUnit + pre-index run | PASS (automated) |
| Esc closes modal | Backdrop button with aria-label | Same | Code review | PASS (code) |
| Keyboard / focus trap | Partial — backdrop focusable, no explicit trap | Same | Code review | LIMIT — manual verify recommended |
| Object URL on success handoff | Preview URL passed to parent, not revoked on success submit | Same | Code review | PASS (code) |

**Note:** Recommend one manual browser pass on `http://localhost:8093` in EN + AR before public launch.
