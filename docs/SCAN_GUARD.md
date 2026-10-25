# Scan Guard methodology

Scan Guard is a local, advisory validation layer. It does not upload payloads or images and does not claim certification, universal phone compatibility, or guaranteed print performance.

## Evidence pipeline

1. The current QR settings are rendered to an image independently of the visible preview.
2. `jsQR` decodes the rendered pixels and the decoded value must exactly match the original UTF-8 payload.
3. Pixel bounds are measured to estimate the module size and the actual quiet zone. A safe result requires at least four modules on every side.
4. Body and finder colors are compared with the background. Every gradient stop is considered; a transparent background is `UNKNOWN` because the final surface is not known.
5. Logo size, padding, center position, finder-pattern separation, data density, error correction, output dimensions, and format metadata are evaluated.
6. Export validation runs against the actual generated file (or its rasterized representation), not only the canvas preview.

The contrast calculation uses relative luminance as an estimate. WCAG text contrast is not used as a QR certification rule. A passing contrast estimate does not prove that a camera can scan the result.

## States

- `PASS`: all available automated evidence met the implemented conservative checks.
- `WARNING`: decoding succeeded, but one or more conditions deserve attention, such as a large logo or marginal density.
- `FAIL`: decoding failed, the decoded payload differed, or a critical requirement was violated.
- `UNKNOWN`: required evidence could not be established, such as contrast on a transparent final surface.

No percentage score is shown because the checks are not a statistically calibrated probability model. Suggestions never modify the design automatically.

## Export policy

`FAIL` and `UNKNOWN` block download. `WARNING` may be exported after the interface states the risk. This policy applies to PNG, SVG, WebP, JPEG, and PDF. SVG and PDF are rasterized locally for independent decoding; JPEG is flattened to an opaque background.

## Known limits

- Browser decoding cannot represent every phone camera, lens, scanner application, display, printer, paper, ink, lighting condition, or viewing distance.
- Transparent artwork cannot receive a reliable contrast verdict until its final background is known.
- Pixel-boundary measurement is an estimate derived from the generated image and may become unavailable when contrast is too weak to locate the symbol.
- A single decoder is independent from the QR renderer but is not a substitute for testing several physical devices and applications.
