# 0008. Trusted publishing and supply-chain hardening

- Status: Accepted
- Date: 2026-11-01

## Context

Khee is installed by other projects.
A compromised release, a leaked npm token, or a malicious install script would spread to every consumer.

## Decision

**Publishing**

- Changesets manages versions. Every PR that changes published code includes a changeset.
- The Changesets action opens a "Version packages" PR. Merging it publishes from GitHub Actions using npm trusted publishing with provenance.
- No npm token is stored anywhere.
- Only the release workflow on `main` gets `id-token: write`.

**Packages**

- No `install`, `preinstall`, `postinstall`, or `prepare` scripts in published packages.
- Runtime dependencies stay minimal, and each new one is justified in the PR.

**CI and repository**

- PR CI runs with read-only `permissions:` and no secrets.
- Never use `pull_request_target` for workflows that check out or run PR code. Fork PRs get no secrets.
- Every GitHub Action is pinned to a full commit SHA.
- Every workflow declares least-privilege `permissions:` explicitly.
- `main` is protected: required reviews, required status checks, no force pushes, and no bypass for bots or apps.
- The lockfile is committed. Dependabot is enabled for npm dependencies and GitHub Actions.
- 2FA is required on GitHub and npm.

## Consequences

- Each release is traceable to a commit and workflow run through npm provenance.
- There is no long-lived credential to leak.
- SHA pinning makes Action updates explicit. Dependabot keeps them current.
- Releases depend on GitHub Actions and npm's trusted publishing integration being available.
