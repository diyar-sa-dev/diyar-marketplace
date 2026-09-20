# STAGE 30.13 — Implementation

**Date:** 2026-09-20  
**Provider (roadmap default):** OpenAI image compositing (`driver=openai`)

## Delivered

- `OpenAiTryInRoomCompositeProvider` — compositing capability behind `VisualizationProviderInterface`
- `OpenAiVisualizationHttpClient` — bounded HTTP, `b64_json` response (no SSRF URL fetch)
- `VisualizationPrivacyGate` — blocks external transfer until the canonical status block under `## Status` in `AI_VISUALIZATION_LEGAL_APPROVAL.md` contains exactly `Status: APPROVED` (example text elsewhere in the file is ignored). Resolves the file from `backend/` and monorepo root (`dirname(base_path())`).
- `TryInRoomPrivateImageReader` / `TryInRoomResultImageStore` — private disk in/out, size + PNG validation
- Registry driver `openai`; config under `diyar.visualization.openai.*`

## Not delivered (gates)

- Live OpenAI calls in CI/production while legal artifact is **PENDING**
- Staging job samples (roadmap acceptance)
- Product image as second input (V1 prompt-only compositing on room photo)
- Signed `result_url` on poll API (still metadata in job `result` array)

## Configuration

| Key | Purpose |
|-----|---------|
| `DIYAR_VISUALIZATION_DRIVER` | `null` \| `stub` \| `openai` |
| `DIYAR_FEATURE_AI_VISUALIZATION_ENABLED` | required for non-stub drivers |
| `DIYAR_VISUALIZATION_OPENAI_API_KEY` | server-only |
| `diyar.visualization.legal_approval_path` | repo file gate |

## Privacy / legal

See `conception/Stages/Stage 30/RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md` — **Status: PENDING**.
