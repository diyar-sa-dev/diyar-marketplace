# Pre–Stage 30.11 Hardening — Face 2 Adversarial Review

**Date:** 2026-09-19  
**Result:** **PASS** (after F-001 fix)

---

## Attacks performed

| Attack | Expected | Actual (post-fix) | Severity | Regression |
|--------|----------|-------------------|----------|------------|
| IDOR design/cart | 404 | PHPUnit + E2E spec | — | Existing |
| Session reset every drag | Stable selection | **Was broken** → fixed | P1 | `RoomDesignerCanvasHost.session.test.tsx` |
| 409 autosave storm | No auto-retry | CONFLICT, single save call | — | `roomDesignAutosave.test.ts` |
| 25× markDirty | 1 save | 1 save | — | autosave test |
| Mass assign version/user | Ignored | Service-controlled | — | PHPUnit |
| Fabric in main bundle | Absent | grep main chunk | — | build output |
| Pinch → domain | No commands | viewport only | — | viewportPinchZoom test |
| Create fail retry | Can retry | createStarted reset | P2 | code fix |
| Mount/unmount renderer | destroy() | cancelled async + destroy | — | FabricRoomRenderer.test |
| Change designId | New session | sessionResetKey once per id | — | session test |

---

## Evidence challenges (Face 2)

| Face 1 claim | Challenge | Verdict |
|--------------|-----------|---------|
| “Mobile works” | Only emulation spec | NOT VERIFIED devices |
| “E2E ready” | Not executed | NOT VERIFIED |
| “Production ready” | Flag off + gaps | **Rejected wording** — use “foundation ready with limitations” |

---

## Final result

No remaining **P0/P1** after F-001 fix. Foundation suitable for **Stage 30.11 Face 1 audit** against official roadmap spec (upload, private storage, job stub — **not implemented in this task**).
