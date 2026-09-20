# STAGE 30.13 — Test Evidence

**Executed:** 2026-09-20 (local PHPUnit SQLite; Vitest; Vite build)

| Command | Tests | Result |
|---------|-------|--------|
| `php artisan test tests/Unit/Jobs/TryInRoom tests/Unit/Services/TryInRoom tests/Feature/Api/V1/TryInRoom tests/Unit/Services/Visualization` | **46** / **46** | **PASS** |
| `php artisan test --filter=RoomDesign` | **21** / **21** | **PASS** |
| `npm run test -- validateTryInRoomFile mapTryInRoomSubmitError` (frontend) | **5** / **5** | **PASS** |
| `npm run build` (frontend) | — | **PASS** |

### 30.13-focused (included in visualization suite)

| Test class | Focus |
|------------|--------|
| `VisualizationPrivacyGateTest` | PENDING / APPROVED block / REJECTED / example line ignored |
| `OpenAiLegalGateIntegrationTest` | `driver=openai` + pending legal → `legal_privacy_gate_closed`, `Http::assertNothingSent()` |
| `OpenAiTryInRoomCompositeProviderTest` | Gate-before-HTTP, happy path (mock gate + Http::fake), oversized base64 |
| `OpenAiVisualizationHttpClientTest` | Missing key, 401, 429, malformed JSON |
| `VisualizationProvidersTest` | Registry includes `openai` |

### Privacy gate (manual invariant)

- Repository file `AI_VISUALIZATION_LEGAL_APPROVAL.md` → **Status: PENDING** → gate **closed** (no external HTTP).

## NOT VERIFIED

- Real OpenAI live call (blocked by legal gate)
- E2E try-in-room with `driver=openai`
- Staging job samples
- Production MySQL / multi-worker Redis quota
- Full Vitest room-designer suite (only try-in-room unit tests run this session)
