# QR reliability matrix

Independent decoder: `jsQR`, applied to exported/rasterized output rather than canvas state alone.

| Coverage | Result |
|---|---|
| Default and Arabic UTF-8 payloads | PASS |
| Gradient and conservative-logo designs | PASS |
| ECC L/M/Q/H × 256/512/1024/2048 | 16/16 PASS |
| PNG 4096px | PASS, decoded payload match |
| SVG, WebP, JPEG, PDF | PASS, rendered/rasterized and decoded payload match |
| Large logo | WARNING surfaced; decoded in tested case |
| Transparent background | UNKNOWN contrast surfaced and unsafe export blocked |
| Low contrast | FAIL surfaced; decoder failed as expected |
| Dense 256px payload | FAIL density surfaced; decoder happened to pass |
| Runtime errors | 0 in completed matrix |

Decoder success is not a guarantee across phones, cameras, print processes, materials, lighting, or damage.
