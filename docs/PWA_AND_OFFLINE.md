# PWA and offline architecture

Phase 10 turns QR Studio Pro into an installable, local-first Progressive Web App without adding a backend or runtime CDN dependency.

## Manifest and paths

The manifest uses relative `start_url`, `scope`, and icon paths so a build can be hosted below a domain subpath. It declares standalone display, Arabic metadata, project theme colors, 192px and 512px icons, a maskable icon, and an Apple touch icon. English remains available inside the application.

## Service worker policy

The Vite build plugin enumerates the exact production output and derives a cache version from file contents. The worker precaches only application files. Navigation uses the network when available and falls back to the cached `index.html`; hashed static assets use cache-first behavior. Activation deletes older caches whose names start with `qr-studio-`.

The worker ignores non-GET, cross-origin, and unlisted requests. User payloads, Wi-Fi passwords, project JSON, generated QR files, Blob URLs, and IndexedDB records are never added to Cache Storage. Cache cleanup never opens or deletes IndexedDB.

## Installation and updates

The install button appears only after a real `beforeinstallprompt` event. Other supported platforms receive browser-menu/Add to Home Screen instructions. Standalone mode is detected and the prompt is then hidden.

When a waiting service worker is detected, the UI asks the user to update. The Update button is disabled while the current editor snapshot differs from the last explicitly saved snapshot. Updating sends `SKIP_WAITING`; the page reloads only after `controllerchange`. Projects remain in IndexedDB.

## Offline boundary

All application JavaScript, fonts, QR rendering, decoding, templates, export engines, PDF support, and icons are bundled and precached. There are no runtime APIs, analytics, telemetry, remote fonts, or CDN scripts. A first successful online load and service-worker activation is required before offline navigation can work.

Browser storage is not a durable encrypted backup. Users should export important projects and understand that clearing site data can remove both the offline application cache and IndexedDB projects.
