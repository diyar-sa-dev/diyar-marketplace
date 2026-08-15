# OpenAI — AI Provider

> **Status:** SELECTED — integration **DEFERRED**  
> **Target stage:** V2 / AI stage (future)

---

## Provider

**OpenAI**

Used for future:

- AI text generation
- AI-assisted application features
- Image understanding where required
- AI image generation

---

## Integration Status

| Item | Status |
|------|--------|
| Provider selected | **Yes** |
| API keys in repo | **No** |
| `OpenAIProvider` / `OpenAIImageProvider` | **NOT YET IMPLEMENTED** |
| AI Designer / chat features wired to API | **NOT YET IMPLEMENTED** (frontend mock only) |

---

## DIYAR Architecture (Required)

```text
AI feature module
    ↓
AIProvider (interface)
    ↓
OpenAIProvider
```

Image generation:

```text
ImageGenerationProvider (interface)
    ↓
OpenAIImageProvider
```

**Rule:** UI pages (e.g. AI Designer mock) must not embed OpenAI calls directly. Use provider abstractions behind application services.

---

## Explicitly Out of Scope (Stage 1)

- No OpenAI SDK in backend
- No fake API keys
- No AI business logic in this foundation phase

---

## Environment Variables (Future — Local Only)

```text
OPENAI_API_KEY=     # never commit
OPENAI_ORG_ID=      # optional, never commit
```

---

## Related

- [`../../PROJECT_SPECIFICATION.md`](../../PROJECT_SPECIFICATION.md) — historical AI mock references (REFERENCE — SUPERSEDED for tech)
- [`../../adr/ADR-006-external-providers.md`](../../adr/ADR-006-external-providers.md)
