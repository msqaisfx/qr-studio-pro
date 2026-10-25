# Security and privacy audit

Result: **PASS with release conditions**. No critical or high-risk issue was found in the tested scope.

- Dependency audit: `pnpm audit --prod --json` reported 0 critical, high, moderate, low, or informational advisories across 93 resolved dependencies.
- XSS/HTML injection: browser-injected HTML/script payload remained inert; no script node or execution occurred.
- Unsafe URLs: only HTTP/HTTPS website payloads are accepted; `javascript:`, `data:`, and `file:` are rejected by tests.
- SVG/MIME spoofing: SVG uploads are rejected; PNG/JPEG/WebP signatures and decoded dimensions are validated locally.
- Project JSON: size, kind, schema, required fields, design values, export format, and embedded-logo data URL are validated; malformed and prototype-shaped objects are rejected without prototype pollution.
- Object URLs: every creation site has a matching deferred revocation. ImageBitmap instances are closed.
- Network/privacy: the Chrome audit observed 18 requests, all to the local application origin; no payload request, analytics, telemetry, remote font, or tracker was observed.
- IndexedDB: stores local projects only. Sensitive Wi-Fi data requires explicit consent. Console leak tests passed.
- Service worker: precaches static build assets only, rejects cross-origin requests, deletes only old `qr-studio-*` caches, and does not touch IndexedDB.
- Secrets: repository scan found no recognized private-key or common token pattern. `.env*`, logs, build, coverage, work, and local files are ignored.

Residual supply-chain risk remains because a zero-advisory registry result cannot prove dependencies are safe. Lockfile review and future automated audit updates are recommended.
