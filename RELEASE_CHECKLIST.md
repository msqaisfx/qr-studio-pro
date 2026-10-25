# Release checklist

## Legal and repository

- [x] Confirm the legal copyright holder and update `LICENSE`
- [x] Review production dependency and font licenses
- [x] Confirm no Git remote, push, release, or deployment occurred during Phase 12A
- [x] Replace repository placeholders with `msqaisfx/qr-studio-pro`
- [ ] Configure a private vulnerability-reporting channel

## Quality gates

- [x] TypeScript
- [x] ESLint
- [x] Vitest
- [x] Production build
- [x] Production dependency audit
- [x] Chrome functional, offline, export, and QR decode automation
- [ ] Firefox functional acceptance
- [ ] Safari functional acceptance
- [ ] Separate Chromium functional acceptance
- [ ] Real-device camera and PWA acceptance

## Privacy and security

- [x] No analytics, tracking, backend, or remote project storage
- [x] Upload, JSON, URL, XSS, SVG, cache, IndexedDB, and object URL reviews
- [x] Secret-pattern scan
- [x] Local-data and domain-migration limitations documented

## Publishing—requires separate approval

- [ ] Create the GitHub repository
- [ ] Add and verify the Git remote
- [ ] Push the reviewed branch
- [ ] Enable the Pages workflow by renaming its `.disabled` file
- [ ] Configure Pages and optional custom domain
- [ ] Run production-origin PWA/offline tests
- [ ] Create a GitHub release

Current status: **CONDITIONAL PASS**. Publishing remains blocked by ownership confirmation and the chosen cross-browser/device acceptance scope.
