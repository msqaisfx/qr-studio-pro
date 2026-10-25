# Export architecture

Phase 07 keeps payload construction, design state, QR rendering, format conversion, validation, and download as separate concerns. All formats use `prepareQrEngine`; no format owns a second QR generator.

## Formats

- PNG: lossless, transparent when requested, 256–4096 px.
- SVG: real vector QR markup from `qr-code-styling`; scripts and external HTTP resources are rejected. A raster user logo is embedded as a local data resource and remains raster.
- WebP: browser-encoded output with quality control and transparency. Quality `1` is the lossless-preferred setting exposed by the browser encoder, but browser implementations ultimately control codec behavior.
- JPEG: quality-controlled and always flattened. White is used when transparency has no explicit color.
- PDF: A4, US Letter, or square page through lazily imported `pdf-lib`, with print margins, QR size, and an optional locally rasterized Unicode title. The QR is a high-resolution PNG inside the PDF, so the PDF is not described as fully vector.

## Safety gates

`sanitizeFilename` removes traversal separators, control characters, reserved names, and conflicting extensions while preserving safe Unicode. Before download, the application checks MIME/signature or SVG structure and independently decodes the actual image. PDF uses the exact high-resolution PNG embedded into the document as its scan source. Object URLs are revoked after use.

The automated decode result is advisory and does not guarantee every camera, printer, material, lighting condition, or physical size.
