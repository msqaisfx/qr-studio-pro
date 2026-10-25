# GitHub Pages deployment guide

This is a preparation guide only. Phase 11 does not create a remote, push code, publish the application, or create a release.

## Preconditions

1. Confirm the copyright holder in `LICENSE`.
2. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
3. Review `PRIVACY.md`, `SECURITY.md`, and the Phase 11 release checklist.
4. Obtain explicit approval to publish.

## Project-site build

Vite's default build targets the origin root. For a repository project page such as `https://OWNER.github.io/qr-studio-pro/`, set the Vite base path before building:

```bash
VITE_BASE_PATH=/qr-studio-pro/ pnpm build
```

For an origin-root deployment, use the default `pnpm build` command. Publish only the generated `dist/` directory through an approved GitHub Pages workflow. HTTPS is required for service-worker installation outside localhost.

After deployment, verify installability, offline navigation, all five export formats, cache update behavior, and IndexedDB persistence on the actual production URL. Do not treat localhost results as proof of production hosting behavior.
