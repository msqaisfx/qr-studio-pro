# Project phases

Phase 01 establishes the local-first React application, internationalization foundation, theme support, QR generation, tests, and project governance files. Advanced design tools, accounts, persistence services, analytics, payments, and deployment are intentionally outside this phase.

Phase 02 introduces the professional studio shell, design tokens, tools navigation, responsive QR canvas, content validation, and inspector metadata. Advanced tools remain visibly marked as future work and are not simulated.

Phase 03 activates Shapes with all six body patterns supported by qr-code-styling 1.9.2, supported corner controls, four export sizes, L/M/Q/H error correction, UTF-8 input, and a calculated four-module quiet zone. Exported PNGs are decoded during the browser verification workflow; colors, logos, and templates remain future work.

Phase 04 activates Colors with independent solid, linear-gradient, and radial-gradient styling for the QR body and corners, solid or transparent backgrounds, nine real presets, and an advisory contrast guard. Browser verification decodes exported PNGs across representative shape, size, and correction-level combinations. Logos, frames, and complete templates remain future work.

Phase 05 activates local PNG, JPEG, and WebP logo upload with signature validation, bounded dimensions, drag-and-drop, center placement, three masks, background and padding controls, and automatic exported-PNG decoding. The Smart Logo Guard reports an automated test—not a device guarantee—and offers conservative sizing and H-correction actions. Frames and complete templates remain future work.

Phase 06 replaces the single free-form content input with a discriminated-union architecture for website, text, Wi-Fi, vCard 3.0, WhatsApp, email, phone, SMS, HTTPS map location, iCalendar VEVENT, and network-specific crypto payloads. Forms retain per-type state only in memory, apply type-specific validation and escaping, and continue through the single existing rendering, styling, logo, and export pipeline.

Phase 07 activates a unified, local-only export studio for PNG, true SVG artwork, WebP, JPEG, and print-ready PDF. Raster sizes range from 256 to 4096 pixels, JPEG is safely flattened, PDF rendering is lazily loaded, filenames are sanitized, and every download is gated by file-integrity and independent QR-decode checks. PDF contains a high-resolution raster QR; an uploaded raster logo remains raster inside otherwise-vector SVG output.

Phase 08 activates an independent, local-only Scan Guard. It decodes the rendered or exported image, verifies exact UTF-8 payload equality, measures the quiet zone and effective module density from pixels, and evaluates advisory contrast, logo coverage, finder-pattern risk, and format integrity. Results use PASS, WARNING, FAIL, or UNKNOWN without a fabricated score. Exports are blocked on FAIL, payload mismatch, or UNKNOWN verification; WARNING remains exportable with explicit disclosure. This automated guard is not a scientific certification or a substitute for real-device and print testing.

Phase 09 adds versioned IndexedDB project storage, explicit sensitive-data consent, optional debounced autosave, complete project CRUD, portable validated JSON files, state restoration, and twelve editable professional templates. All storage remains local; IndexedDB and exported JSON are not represented as encrypted storage.
