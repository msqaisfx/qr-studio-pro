# Smart Logo Fusion V3 — Final Visual Acceptance

Date: 2026-10-27

Version: `v0.9.2-beta.1`

Branch: `feature/smart-logo-fusion-v3`

Decision: **SUPERSEDED — the original MSQAISFX logo was provided and tested in `../real-logo-acceptance/`**

## Source-file verification

No standalone original MSQAISFX logo was found in the project or available Codex attachments.

The apparent candidates under `artifacts/smart-logo-v2/` are application screenshots, not logo source files:

- `original-logo.jpg`: JPEG, 417 × 2487 px.
- `trimmed-logo.jpg`: JPEG, 417 × 2487 px.
- `background-removed.jpg`: JPEG, 417 × 2406 px.

The files include the application UI, controls, and QR preview. Extracting the small embedded mark from them would introduce screenshot scaling, compression, surrounding pixels, and an unverifiable crop. They therefore cannot be used as final evidence for the real logo.

## Why the analogous test selected 14%

The result is caused by the adaptive safety policy, not by decoder failure:

1. The default ECC level is `M`, whose configured safe central span is 5 modules.
2. The horizontal test logo has an aspect ratio that applies a one-module shape penalty.
3. The resulting safe span is 4 modules.
4. The current centered-zone policy requires an odd whole-module span to preserve symmetric module boundaries, so 4 becomes 3 modules.
5. Every requested candidate above the limit is clamped to the same 3-module applied zone.
6. All 8/8 candidates decoded, but they did not represent eight different applied logo zones. The selection tie therefore retained the first requested candidate, 14%.

This is intentionally not relaxed without testing the original logo. Decoder success alone is insufficient evidence for visible logo quality or real-device scanning.

## Acceptance items not executable without the original asset

- Original versus background-removed visual comparison.
- Auto Trim accuracy on the real artwork.
- Seamless Fusion and Premium Brand visual inspection.
- Adaptive enlargement at 512 px.
- Full Logo versus Symbol Focus comparison.
- Manual crop selection for Symbol Focus.
- Multi-size visual matrix using the real logo.
- Cross-format logo fidelity acceptance for PNG, SVG, WebP, JPEG, and PDF.

## Required input

Upload the original MSQAISFX logo as PNG, WebP, or JPEG. PNG/WebP with transparency is preferred. Do not provide a screenshot containing the logo. If Symbol Focus is required, a separate symbol-only source is preferred; otherwise a manual crop can be reviewed after the full logo is available.

## Release safety

No code limit was raised, and no push, pull request, merge, deployment, tag, or release was performed. Final PR readiness remains blocked pending real-logo visual acceptance.
