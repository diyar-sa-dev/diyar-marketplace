# STAGE 30.13 — Face 2 Audit

**Date:** 2026-09-20  
**Auditor stance:** Independent adversarial re-review after Face 1 hardening (repository = source of truth).

## Gate

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |

## Face 1 → Face 2 fix loop (resolved this session)

| ID | Was | Finding | Resolution |
|----|-----|---------|------------|
| F13-P1a | P1 | Approval file under monorepo root not found when only `base_path()` (`backend/`) was checked — gate could appear closed while parsing wrong/missing file | Dual candidate paths in `VisualizationPrivacyGate::resolveApprovalFilePath()` |
| F13-P1b | P1 | Example `Status: APPROVED` line in same markdown could satisfy a loose regex | Parse **only** the fenced block under `## Status`; require canonical `Status: APPROVED` line |
| F13-P1c | P1 | Invalid PCRE `[^\R]` threw at runtime — gate did not fail closed via normalized provider error | Regex uses `[\r\n]` / `[^\r\n]`; covered by `VisualizationPrivacyGateTest` |

## Findings (open / accepted)

| ID | Sev | Finding | Disposition |
|----|-----|---------|-------------|
| F13-01 | P2 | Legal/privacy artifact **PENDING** — production must not send user photos externally | **By design** — `VisualizationPrivacyGate` |
| F13-02 | P2 | OpenAI `/images/edits` contract may differ by model; not live-verified | **Accepted** — fixture tests only; adjust when staging |
| F13-03 | P2 | Compositing uses room photo + text prompt only (no product cutout image yet) | **Accepted** — minimal 30.13 scope |
| F13-04 | P3 | `result_url` poll field still null | **Deferred** — 30.11 limitation |
| F13-05 | P3 | No opt-in live provider test harness | **Deferred** — add only after legal APPROVED + product sign-off |

## Attack matrix (summary)

| Attack | Result |
|--------|--------|
| Legal bypass (`driver=openai`, approval PENDING) | **BLOCKED** — test: `OpenAiLegalGateIntegrationTest`, provider unit test |
| Env bypass of legal gate | **None** — gate reads file only |
| Direct provider without gate | **BLOCKED** — provider checks gate first |
| Client selects OpenAI driver | **Not possible** — server config only (30.12) |
| SSRF via provider URL | **N/A** — `b64_json` only, no URL fetch |
| Oversized base64 | **Rejected** — encoded size cap before decode |
| Secret in API/frontend | **Not observed** — static review + tests use fake keys |
| Quota / circuit bypass via OpenAI | **No** — still via `VisualizationService` (30.12 regression) |

## Security checks

- Credentials server-side config only — **STATICALLY VERIFIED**
- Gate closed → no HTTP — **TEST VERIFIED** (`Http::assertNothingSent()`)
- Result stored private disk — **TEST VERIFIED** (mock gate success path)
- No client provider selection — **STATICALLY VERIFIED** (30.12)
