# QR Studio Pro design system

Phase 02 uses a compact token-based system defined in `src/styles/index.css`.

## Foundations

- **Typography:** Inter Variable for Latin content and Noto Sans Arabic Variable for Arabic. Both OFL-licensed font packages are bundled locally; the running app makes no font-service requests.
- **Color:** neutral graphite surfaces with a restrained emerald accent. Light and dark values share semantic token names.
- **Spacing:** component spacing follows a 4px-derived rhythm with primary steps at 8, 12, 16, 24, and 28px.
- **Radius:** 9px controls, 13px content cards, and 18px studio shells.
- **Elevation:** shadows are reserved for the workspace shell and QR artboard.
- **Motion:** short 180ms interaction transitions, reduced to near-zero when `prefers-reduced-motion` is enabled.

## Semantic tokens

The primary CSS variables are `--bg`, `--header`, `--panel`, `--raised`, `--soft`, `--canvas`, `--line`, `--line-strong`, `--text`, `--text-2`, `--muted`, `--accent`, `--accent-soft`, `--danger`, `--radius`, and `--shadow`.

## Breakpoints

- Above 1180px: four-region studio layout.
- 821–1180px: inspector becomes a lower summary rail.
- 521–820px: compact sidebar with vertically stacked workspace regions.
- Up to 520px: horizontally scrollable tool rail and single-column panels.

The page itself never scrolls horizontally; only the intentionally bounded mobile tool rail may scroll to expose future tools.
