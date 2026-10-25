# Custom domain migration

GitHub Pages may later serve the application from `qr.msqaisfx.com`, but this release does not configure DNS or a `CNAME` file.

## Future process

1. Obtain explicit deployment approval and verify ownership of the domain.
2. Configure the custom domain in GitHub Pages.
3. Add the DNS records shown by GitHub; do not copy example addresses blindly.
4. Add a `public/CNAME` file containing only the confirmed hostname.
5. Build with `VITE_BASE_PATH=/` unless the custom domain deliberately serves from a subdirectory.
6. Wait for DNS and certificate validation, then enforce HTTPS.
7. Re-run PWA, offline, export, and cross-browser acceptance on the custom origin.

## Local project migration warning

Browser storage is origin-scoped. IndexedDB projects, autosave data, local preferences, service-worker caches, and install state from `msqaisfx.github.io/qr-studio-pro` do **not** automatically move to `qr.msqaisfx.com`.

Before changing domains, users should export important projects as validated QR Studio JSON files. After opening the custom domain, they can import those files manually. Never promise automatic migration between origins, and keep the previous origin available for a documented transition period when practical.
