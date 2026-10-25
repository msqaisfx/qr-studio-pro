# Performance report

- Initial JavaScript: 467,970 bytes raw / 153,840 bytes gzip.
- Previous initial JavaScript: 507,111 bytes raw / 163,480 bytes gzip.
- Reduction: 39,141 bytes raw / 9,640 bytes gzip.
- Lazy chunks: Projects, Templates, Shapes, Colors, Logo, Quality, Export, and PDF language/runtime code.
- Largest lazy chunk: PDF-related `es` chunk, 419,830 bytes raw / 175,530 bytes gzip.
- 4096px PNG export and independent decode: PASS, 571,693 bytes, 1,299 ms in the recorded Chrome run.
- PWA cache: 32 static entries in a content-hashed cache. IndexedDB is not read or removed by the worker.
- Object URL lifecycle: all source sites pair creation with revocation; decoded ImageBitmap resources are closed.

These are local development-machine measurements, not field performance or memory profiles. No speculative optimization was applied.
