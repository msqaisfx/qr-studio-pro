# Smart Logo Fusion Engine 3.0 — Local QA Report

Date: 2026-10-27

Branch: `feature/smart-logo-fusion-v3`

Development version: `0.9.2-beta.1`

## Scope and source evidence

The supplied specification referenced a user-reported QR image, but the image itself was not present in the attached files. The reproduction therefore used a local, deliberately difficult horizontal logo with a white canvas and large empty margins. No claim is made that the original customer image was visually inspected.

## Root cause

The previous pipeline treated the uploaded bitmap dimensions as the logo's visual dimensions. Empty/solid margins therefore consumed the center container while the useful mark remained small. The size control represented the outer container, not the visible artwork, and safety decisions were not quantized to complete QR modules. During this phase, browser QA also found a separate `ImageData` conversion defect: spreading an `ImageData` object lost its non-enumerable width and height, which produced invalid bounds. It was fixed by explicitly preserving width, height, and pixel data.

## Implemented corrections

- Separate source dimensions, detected visible-content bounds, container coverage, and visible-content coverage.
- Auto Trim and optional edge-connected solid-background removal remain local and non-destructive to the original source.
- Auto Fit exposes the visible artwork at 100% within the processed logo canvas.
- Adaptive Zone maps the logo container to a centered, odd, whole-module span and applies ECC, density, and aspect-ratio limits.
- Four functional integration presets: Seamless Fusion, Adaptive Badge, Minimal Cutout, and Premium Brand.
- Independent decoder-based search checks eight candidate sizes rather than assuming QR readability is monotonic.
- Preview and export use the same processed logo and settings.
- Project schema upgraded to v3 with migration from v1 and v2, including legacy style mapping.
- Arabic/English labels, keyboard controls, focus behavior, dark/light compatibility, and responsive styles retained.

## Measured before/after result

- Test source: 600 × 360 px; apparent aspect ratio 1.67 before background removal.
- After edge-connected white-background removal: detected visible bounds 387 × 130 px; aspect ratio 2.98.
- Candidate decode search: 8/8 candidate sizes decoded in this controlled test.
- Selected adaptive safe container: 14%. The larger requested candidates were decoded, but the module-aware density/aspect safety cap intentionally retained the smaller applied zone.
- Export validation: PNG 512 × 512, 25,531 bytes, decoded to the exact original URL.
- Runtime errors during the final browser scenario: 0.

## Export and regression verification

- TypeScript: PASS.
- ESLint: PASS.
- Vitest: PASS, 13 files and 80/80 tests.
- Production build: PASS (Vite 8.3.5, 238 modules).
- Production dependency audit: PASS, no known vulnerabilities.
- PNG: PASS, including a 4096 × 4096 matrix sample.
- SVG: PASS.
- WebP: PASS.
- JPEG: PASS.
- PDF: PASS.
- PWA manifest and service worker: PASS.
- Offline navigation, QR generation, logo workflow, IndexedDB project save/open, templates, and all five export formats: PASS.
- Responsive widths 375, 768, 1280, and 1920 px: zero measured horizontal overflow.
- Offline Scan Guard returned `warning` for its test fixture; this is an expected non-guarantee state, not a runtime failure.

## Safety and known limitations

- Decoder success is evidence for the tested rendering only and cannot guarantee scanning on every camera, print process, surface, or lighting condition.
- Complex, textured, shadowed, or multi-color backgrounds are not automatically removed; the edge-connected solid-background tool is intentionally conservative.
- Fine-print or trademark text is never deleted automatically. An opt-in, explicitly confirmed processor can remove only tiny detached opaque components from the QR-only copy; the original remains preserved and Undo is available. Connected or complex text still requires manual review because deterministic removal cannot safely infer brand intent.
- The implementation uses `qr-code-styling`'s background-dot hiding after module-aligned sizing; it does not rewrite finder, timing, alignment, or format modules.
- Low-resolution warnings are advisory and do not fabricate missing detail.

## Evidence files

- `before-after.png`
- `white-background-removal.png`
- `enlarged-logo.png`
- `transparent-logo.png`
- `seamless-fusion.png`
- `adaptive-badge.png`
- `minimal-cutout.png`
- `premium-brand.png`
- `small-logo.png`
- `maximum-readable-size.png`
- `fusion-export.png`
- `verification.json`
- `export-matrix/`
- `pwa/`

## Release safety

All work remains local on `feature/smart-logo-fusion-v3`. No push, pull request, merge, deployment, tag, or GitHub release was performed.
