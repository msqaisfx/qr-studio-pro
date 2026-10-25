# Logo security and scan guard

Logo files are processed entirely in the browser. QR Studio Pro accepts PNG, JPEG, and WebP only after checking the file signature, limits files to 5 MB and decoded dimensions to 4096 × 4096 pixels, and rejects SVG, disguised, unsupported, or undecodable files. The application does not execute image content, fetch remote logo URLs, or upload image data.

The processed logo is rasterized to a local PNG canvas before it reaches `qr-code-styling`. Its mask, background, and padding are therefore identical in preview and export. No persistent object URL is created.

Smart Logo Guard generates a 512px PNG and decodes it with `jsQR` after relevant changes. A successful result proves only that this automated sample decoded in the current browser. It does not guarantee scanning on every phone, print process, screen, lighting condition, or destination background. H error correction and conservative logo sizing are recommendations that remain under explicit user control.
