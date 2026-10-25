# Deployment preparation

No deployment is performed by this repository state.

## GitHub Pages

The candidate workflow is stored as `.github/workflows/pages-deploy.yml.disabled`, so GitHub will not execute it. After explicit approval:

1. Review the workflow and current GitHub Actions versions.
2. Rename it to `.github/workflows/pages-deploy.yml`.
3. Configure Pages to use GitHub Actions.
4. Run it manually with `workflow_dispatch`.
5. Verify the resulting HTTPS project URL before announcing it.

The build derives `VITE_BASE_PATH` from `github.event.repository.name`, so it does not assume a GitHub username and supports repository subpaths. The generated manifest, service worker, assets, and navigation fallback use the configured base path.

## Required production verification

- HTTPS and manifest discovery
- Service-worker registration and update flow
- Offline navigation and QR generation
- Local project persistence through an application update
- PNG, SVG, WebP, JPEG, and PDF export
- QR decoding from exported files
- Arabic/English, RTL/LTR, dark/light, and responsive layouts

Static hosting cannot provide server-side fallback rules. The app intentionally uses hash navigation and a precached application shell to remain compatible with Pages.
