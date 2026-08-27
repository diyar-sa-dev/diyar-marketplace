# Phase 28.4 — Browser Compatibility

---

## Tested

| Browser | Tool | Result |
|---------|------|--------|
| Chromium | Playwright 1.62 | 33/39 E2E pass |

---

## Not tested in 28.4

| Browser | Status |
|---------|--------|
| Firefox | **NOT VERIFIED** |
| Edge | **NOT VERIFIED** (Chromium-based — likely similar) |
| Safari | **NOT VERIFIED** |

---

## Browser APIs used (inventory)

| API | Risk |
|-----|------|
| `localStorage` | Locale, affiliate session |
| `document.documentElement.dir` | RTL |
| `FormData` | Uploads |
| WebSocket (Pusher) | Chat |
| CSS custom properties | Platform theme |
| `import.meta.env` | Vite — build-time only |

No exotic APIs (WebRTC, SharedArrayBuffer) identified in core paths.

---

## CI alignment

GitHub Actions uses Node 22; local Node 23.11 — build/tests pass locally.

---

## Gate

```text
PARTIAL
```

Chromium-only E2E evidence. Cross-browser **NOT VERIFIED**.
