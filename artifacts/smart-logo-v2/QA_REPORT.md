# Smart Logo Studio 2.0 — Local QA Evidence

Date: 2026-10-27
Branch: `feature/smart-logo-studio-v2`
Target: `v0.9.1-beta.1`

## Root cause and correction

The previous renderer placed every source inside a fixed 512×512 square, applied padding inside that square, and then treated the entire square as the QR image. Transparent source padding and the mandatory white container reduced the visible mark further. Smart Logo Studio 2.0 separates the QR container, visible artwork scale, and padding; trims alpha padding; preserves aspect ratio; and makes backgrounds explicit.

## Automated results

- TypeScript: PASS
- Vitest: PASS — 75/75 tests, 13/13 files
- Production build: PASS
- Production dependency audit: PASS — no known vulnerabilities
- Logo pixel processing: PASS — alpha bounds, edge-connected removal, protected interior pixels, scale/quality analysis
- Project migration: PASS — schema 1 logo project migrated to schema 2 with the embedded data preserved
- Browser runtime errors: 0
- Responsive overflow at 375, 768, 1280, and 1920px: 0
- PWA manifest/service worker/offline navigation: PASS
- Offline local logo workflow, IndexedDB save/open, and five export formats: PASS

## Export and independent decode

| Format | Resolution | UI guard | Signature/integrity | Independent QR decode |
| --- | ---: | --- | --- | --- |
| PNG | 4096×4096 | valid | PASS | PASS |
| SVG | 512×512 | valid | embedded local raster logo; no scripts/external resources | PASS after rasterization |
| WebP | 1024×1024 | valid | PASS | PASS after PNG conversion |
| JPEG | 1024×1024 | valid | PASS | PASS after PNG conversion |
| PDF | A4 / 2048px source | valid | one-page PDF 1.7 | PASS after page rasterization |

Automated decode evidence is not a guarantee for every camera, print surface, distance, or lighting condition.

## Visual evidence

The folder contains actual application captures for original, trimmed, background-removed, Clean, Seamless, Badge, before/after, QR with logo, export panels, and the README hero.

## Known limitations

- Solid-background removal is intentionally limited to near-uniform pixels connected to image edges. Complex photographic backgrounds are not silently over-processed.
- JPEG cannot preserve transparency; the export pipeline flattens it onto a safe background.
- SVG keeps an uploaded bitmap logo as an embedded raster image while QR geometry remains vector.
- Real-device camera and print testing remains recommended before production use.
