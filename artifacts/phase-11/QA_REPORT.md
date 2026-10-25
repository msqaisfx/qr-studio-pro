# Phase 11 QA Report

Date: 2026-10-25  
Decision: **CONDITIONAL PASS**

## Executed gates

- TypeScript: PASS
- ESLint: PASS
- Vitest: PASS — 71 tests in 13 files
- Production build: PASS
- GitHub Pages subpath build: PASS
- Chrome production functional test: PASS, zero runtime errors
- Projects, autosave, JSON round-trip, 12 templates: PASS
- PWA/offline navigation, editing, projects, Scan Guard and five export formats: PASS
- Responsive widths 375, 768, 1280 and 1920: PASS, zero horizontal overflow

The eleven content encoders and their error cases are covered by unit tests. Shape/color/logo/export and Scan Guard regression suites passed. QR decoding is advisory and does not guarantee every camera, printer, material, or device.

## Fixes made during Phase 11

- Added security regression tests for unsafe URL schemes, inert HTML payloads, malicious/unsupported project JSON, SVG upload rejection, MIME spoofing and prototype-pollution resistance.
- Added privacy, changelog, and GitHub Pages preparation documentation.
- Added configurable Vite base-path support for a project-site build.
- Fixed a race in the legacy Phase 08 test harness; application behavior was not changed.

## Release blockers and conditions

- `LICENSE` still contains `[COPYRIGHT HOLDER TO BE CONFIRMED]`; public release must wait for confirmation.
- Full functional runs were completed only in Chrome Desktop. Firefox headless failed to complete in this environment; Chromium and Safari functional suites were not executed. These are NOT TESTED, not passes.
- No real Android/iOS device, camera, physical print, or installed production-origin PWA test was performed.
