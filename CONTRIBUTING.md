# Contributing to QR Studio Pro

Thank you for helping improve QR Studio Pro.

## Development workflow

1. Create a focused branch from the current default branch.
2. Use Node.js 24 LTS and pnpm 11.25.0, then install with `pnpm install --frozen-lockfile`.
3. Keep changes within the issue or proposal scope.
4. Add or update tests for behavior changes.
5. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
6. Open a pull request explaining the change, verification, and any accessibility or privacy impact.

## Principles

- Preserve the local-first privacy model.
- Maintain Arabic/RTL and English/LTR parity.
- Prefer accessible, dependency-light solutions.
- Do not introduce network transmission of QR content without an explicit, reviewed design decision.
- Use clear commits and avoid unrelated formatting changes.

By contributing, you agree that your contributions will be licensed under the MIT License.

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Never include private QR content, credentials, user logos, project JSON, or secrets in issues, tests, screenshots, or commits.
