# Third-party license review

Generated from the installed production dependency graph with `pnpm licenses list --prod --json` on 2026-10-25. This is an engineering review, not legal advice.

## Summary

| License | Relevant packages | Compatibility review |
|---|---|---|
| MIT | React, React DOM, Vite, Tailwind CSS, qr-code-styling, pdf-lib and transitive packages | Permissive; retain copyright and license notices when redistributing covered source |
| Apache-2.0 | jsQR, detect-libc | Permissive with notice/patent terms; no direct conflict identified |
| OFL-1.1 | Inter Variable, Noto Sans Arabic Variable | Font redistribution permitted under OFL terms; do not sell fonts by themselves or use reserved names contrary to the license |
| ISC / BSD-3-Clause / 0BSD | graceful-fs, picocolors, source-map-js, tslib | Permissive; preserve applicable notices |
| MIT AND Zlib | pako | Dual notice obligations are permissive; preserve notices |
| MPL-2.0 | lightningcss and platform bindings | File-level copyleft; unmodified build-tool distribution presents no identified conflict, but modifications to covered files must remain under MPL-2.0 |

## Direct runtime dependencies

- `@fontsource-variable/inter` 5.3.0 — OFL-1.1
- `@fontsource-variable/noto-sans-arabic` 5.3.0 — OFL-1.1
- `jsqr` 1.4.0 — Apache-2.0
- `pdf-lib` 1.17.1 — MIT
- `qr-code-styling` 1.9.2 — MIT
- `react` / `react-dom` 19.3.1 — MIT
- `tailwindcss` / `@tailwindcss/vite` 4.3.3 — MIT

## Images and project artwork

The repository does not include third-party stock photography or user logos. The favicon, PWA icons, interface SVG marks, and generated QA screenshots are project-generated assets. QA screenshots may contain only synthetic fixture content and must be rechecked before public release.

## Release condition

The project `LICENSE` is MIT and identifies Mohammed Qais Abdulghani as the confirmed copyright owner. This does not change or reassign ownership of third-party libraries, fonts, or their notices.

For a public source distribution, keep this report and upstream license files/notices available. Re-run the license inventory whenever the lockfile changes.
