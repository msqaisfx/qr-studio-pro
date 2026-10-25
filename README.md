# QR Studio Pro

Professional, open-source QR code designer focused on privacy and a clean editing experience.

> Phase 04 — version 0.1.0

## Features

- Real QR generation for URLs, Arabic text, and English text
- Instant preview and PNG export
- Arabic (default, RTL) and English (LTR)
- Dark and light themes
- Professional responsive studio shell with tools, canvas, and inspector
- Six QR body patterns, supported corner styles, export sizing, and L/M/Q/H correction
- Calculated four-module quiet zones and verified UTF-8 QR payloads
- Independent solid or gradient colors for QR modules and corners, plus solid or transparent backgrounds
- Nine live color presets and an advisory multi-stop contrast guard
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
```

## Scope

This version intentionally has no backend, database, accounts, analytics, payments, dynamic QR codes, image or logo uploads, frames, or full templates. See [docs/PHASES.md](docs/PHASES.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), and [docs/CONTRAST_GUARD.md](docs/CONTRAST_GUARD.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT. The copyright holder is intentionally marked for confirmation in [LICENSE](LICENSE).

Arabic documentation: [README.ar.md](README.ar.md)
