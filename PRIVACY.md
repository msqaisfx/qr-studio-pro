# Privacy

QR Studio Pro is local-first. QR payloads, uploaded logos, project data, and exported files are processed in the browser and are not sent to an application server.

## Local data

- Language and theme preferences are stored in `localStorage`.
- Projects and optional autosave data are stored in IndexedDB on the current browser profile.
- The service worker caches only the versioned application shell and static build assets. It does not cache QR payloads, logos, project records, or exports.
- The application contains no analytics, advertising, tracking pixels, remote fonts, or telemetry.

Anyone with access to the same device and browser profile may be able to access locally saved projects. Avoid saving secrets, passwords, private Wi-Fi credentials, or sensitive personal data on a shared device. Clearing site data removes preferences, cached assets, and local projects. Uninstalling the PWA may not remove browser site data on every platform.

Exported images, PDFs, and JSON project files are outside the application's control after download. Store and share them appropriately.

## Network boundary

After the first successful load, the installed application supports its documented offline workflows. The browser may still contact the origin to check for updated application assets when online. No user payload is included in those requests.

Any future feature that introduces remote storage, analytics, accounts, or external APIs requires an explicit privacy review and documentation update.
