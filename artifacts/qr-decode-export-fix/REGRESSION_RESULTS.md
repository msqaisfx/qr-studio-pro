# Regression results

## Automated gates

- TypeScript: PASS
- ESLint: PASS
- Vitest: PASS — 94/94, 14 files
- Production build: PASS — 478 modules
- Production dependency audit: PASS — no known vulnerabilities

## Export files

At ECC H and a 25% real MSQAISFX logo, the actual exported PNG, SVG, WebP, JPEG and PDF all decoded to the expected payload. File hashes and byte sizes are recorded in `verification.json`.

Six real-logo PNG sizes (10, 15, 20, 25, 30 and 35%) produced six distinct hashes and distinct measured visible bounds; all decoded at ECC H.

## PWA and offline

- Manifest and service worker registration/control: PASS
- Offline navigation and local QR generation: PASS
- Offline IndexedDB save/open and persistence after update lifecycle: PASS
- Offline PNG, SVG, WebP, JPEG and PDF exports under ECC H: PASS
- 375, 768, 1280 and 1920 px overflow checks: PASS
- Service worker does not delete IndexedDB; old cache cleanup and explicit update path are present.

## Browsers

- Chrome: full automated matrix, export and PWA/offline tests PASS subject to the documented unsafe designs.
- Safari: local application loaded and generated the expected 29×29 QR from the test URL without a runtime-visible error. Full automated file-download matrix was not available through the Safari control surface and is therefore NOT TESTED.

## Known boundary

The Phase 10 offline fixture first demonstrated a genuine blocked PDF at ECC M with a logo. The fixture was then run with ECC H to verify offline export functionality without bypassing the confirmed safety failure. The blocked ECC M result remains documented rather than being converted to PASS.
