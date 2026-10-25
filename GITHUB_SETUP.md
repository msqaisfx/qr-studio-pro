# GitHub repository setup

Official repository: `https://github.com/msqaisfx/qr-studio-pro`. This guide records the approved setup and remains useful for future maintenance.

1. Confirm the legal owner and replace the placeholder in `LICENSE`.
2. Create an empty repository without auto-generated README, license, or `.gitignore` files.
3. Verify issue and security links point to `msqaisfx/qr-studio-pro`.
4. Configure private vulnerability reporting and branch protection.
5. Require the `Quality / verify` status check before merging.
6. Prefer squash or reviewed merge commits and require pull-request review.
7. Add a remote only after verifying its exact URL and owner.
8. Push only after explicit approval.

Recommended repository settings:

- Default branch: `main`
- Issues: enabled
- Discussions: optional
- Wiki: optional
- Secret scanning and push protection: enabled when available
- Dependabot alerts: enabled
- Pages: disabled until the deployment workflow is reviewed and activated

The active `.github/workflows/quality.yml` performs read-only checkout, locked dependency installation, typecheck, lint, tests, production build, and production dependency audit. It contains no repository secrets.
