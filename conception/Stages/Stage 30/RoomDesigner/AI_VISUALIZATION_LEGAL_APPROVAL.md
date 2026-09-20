# AI Visualization — Legal / Privacy Approval

**Purpose:** Gate external transfer of user room photos to an AI provider (Stage 30.13+).

**Owner:** Product / Legal

---

## Status

```text
Status: PENDING
```

External image transfer to a visualization provider is **not authorized** until this file is updated to:

```text
Status: APPROVED
```

with signed product/legal record in the change history (commit message or linked ticket).

---

## Scope when approved

- Try-in-Room source images (private storage)
- Minimum fields only (image bytes + compositing prompt; no user email/phone)
- Provider: OpenAI (first provider per roadmap) unless superseded by an approved DEC record

---

## References

- `RISK_REGISTER.md` — R11
- `IMPLEMENTATION_ROADMAP.md` — 30.13 dependencies
- `backend/app/Services/Visualization/VisualizationPrivacyGate.php`
