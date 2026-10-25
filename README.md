# QR Studio Pro

Professional, open-source QR code designer focused on privacy and a clean editing experience.

> Phase 11 release-readiness candidate — version 0.1.0

## Features

- Real QR generation for URLs, Arabic text, and English text
- Instant preview and validated PNG, SVG, WebP, JPEG, and PDF export
- Arabic (default, RTL) and English (LTR)
- Dark and light themes
- Professional responsive studio shell with tools, canvas, and inspector
- Six QR body patterns, supported corner styles, export sizing, and L/M/Q/H correction
- Calculated four-module quiet zones and verified UTF-8 QR payloads
- Independent solid or gradient colors for QR modules and corners, plus solid or transparent backgrounds
- Nine live color presets and an advisory multi-stop contrast guard
- Local PNG/JPEG/WebP logo processing with safe shapes, backgrounds, padding, and an independent decode guard
- Eleven locally encoded QR content types: website, text, Wi-Fi, vCard, WhatsApp, email, phone, SMS, location, event, and crypto
- A unified export studio with safe filenames, 256–4096 px raster output, SVG, quality controls, transparency, and print-page settings
- A local Scan Guard with independent payload decoding, measured quiet-zone and density checks, contrast, logo, finder-pattern, and export-format analysis
- Honest PASS, WARNING, FAIL, and UNKNOWN states with advisory recommendations and export blocking for unsafe or unverifiable results
- Versioned local IndexedDB projects with CRUD, search, recent sorting, optional autosave, and portable validated JSON files
- Twelve real, editable professional templates that preserve the current QR content and logo
- Installable PWA with subpath-safe metadata, original icons, offline app shell, and user-controlled updates
- Fully local offline generation, design, Scan Guard, project storage, and PNG/SVG/WebP/JPEG/PDF export after the first load
- Lazy-loaded studio tools that reduce the initial JavaScript bundle
- Locally bundled Inter and Noto Sans Arabic variable fonts
- Local-first: input is processed only in the browser
- TypeScript, linting, unit tests, and production build checks

## Local development

Requirements: Node.js LTS and a compatible package manager (pnpm is used by this repository).

```bash
pnpm install
pnpm dev
```

Then open the URL printed by Vite. Other checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
# With the dev server running:
pnpm verify:phase04
pnpm verify:phase05
pnpm verify:phase06
pnpm verify:phase07
pnpm verify:phase08
pnpm verify:phase09
pnpm verify:phase10
```

## Scope

This version intentionally has no backend, server database, accounts, analytics, payments, dynamic QR codes, or frames. See [docs/PHASES.md](docs/PHASES.md), [docs/PWA_AND_OFFLINE.md](docs/PWA_AND_OFFLINE.md), [docs/LOCAL_PROJECTS.md](docs/LOCAL_PROJECTS.md), and [docs/SCAN_GUARD.md](docs/SCAN_GUARD.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), [CHANGELOG.md](CHANGELOG.md), and the [GitHub Pages preparation guide](docs/GITHUB_PAGES.md).

## License

MIT. The copyright holder is intentionally marked for confirmation in [LICENSE](LICENSE).

Arabic documentation: [README.ar.md](README.ar.md)
