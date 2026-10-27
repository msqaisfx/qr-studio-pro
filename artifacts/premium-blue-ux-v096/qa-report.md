# QR Studio Pro v0.9.6-beta.1 — Local QA

## Export reliability

- The exported file pipeline distinguishes rendering, file-integrity, decode, payload-mismatch, and inconclusive verification outcomes.
- PASS, WARNING, FAIL, and UNKNOWN are rendered explicitly. FAIL and UNKNOWN remain blocked.
- The safer-settings action remains opt-in and never silently changes logo size or ECC.
- A real MSQAISFX logo matrix produced distinct PNG renders at 3, 5, 7, and 9 module spans.
- jsQR decoded the 3, 5, and 9-module samples. It returned no result for the 7-module sample; the app's independent ZXing path matched the payload and allowed the file. This is a confirmed single-decoder false negative, not evidence that every scanner will succeed.
- PNG, SVG, WebP, JPEG, and PDF files were produced by the application and passed the in-app dual-decoder export gate.

## UX and accessibility

- Premium blue tokens: primary `#1769E0`, hover `#1257BA`, navy `#0B1B33`, light background `#F5F8FC`, accent `#3B82F6`.
- Semantic success, warning, and danger colors remain independent from brand blue.
- Body text is 15px; controls and labels are generally 14–16px; headings are 22–30px.
- Preview zoom supports Fit, 100%, 150%, 200%, and Reset without changing the QR payload, logo geometry, or export resolution.
- Automated accessibility inspection found zero unnamed visible controls and zero unlabelled visible form inputs.
- Reduced-motion behavior is present.

## Responsive matrix

Horizontal overflow was zero at 320, 375, 768, 1280, and 1920 CSS pixels. Runtime errors: zero.

## Quality gates

- TypeScript: PASS
- ESLint: PASS
- Vitest: 102/102 PASS
- Production build: PASS
- Dependency audit: no known vulnerabilities
- PWA/offline smoke: PASS against the production preview (manifest, Service Worker, cached app shell, offline cache, QR generation, PNG export, RTL/LTR, and theme toggle); runtime errors: zero.
- IndexedDB safety: no storage schema or destructive IndexedDB operation was introduced.

## Limitation

The real MSQAISFX logo evidence uses the previously supplied 1024×1024 reference (`C513347B-138A-4331-BD6A-D6724F959540.PNG`). Automated decoding does not guarantee scanning on every physical device or camera.
