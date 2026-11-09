# Handoff 05: CI and release

**Phase:** 5 of 6
**Goal:** every PR is gated by read-only, secret-free CI (lint, types, tests, axe, `"use client"`, contrast, packaging, changesets, and Dockerized visual regression), and merging to `main` runs a Changesets release pipeline that publishes to npm with trusted publishing and provenance.
This completes the README's v0.1 "Foundations" milestone.

Read `CLAUDE.md`, handoff 04, and ADRs 0006, 0008, 0009, and 0010 first.
Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Phases 1 to 4 are complete. They were committed directly to `main`.
- No `.github/`, `.changeset/`, or `CODEOWNERS` exist.
- Every check runs locally:
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm format:check`
  - `pnpm test` includes the Storybook story and axe tests (`pnpm test:a11y` is the same suite on its own)
  - `pnpm --filter @khee/react check:use-client` and `pnpm --filter @khee/tokens check:contrast`
  - `pnpm test:visual` runs Playwright against a `linux/amd64` Playwright image, pinned by tag and digest in `apps/storybook/scripts/visual.ts`
- Both publishable packages are at `0.0.0` and have never been published.
  Their `package.json` files have no `description`, `repository`, `homepage`, `bugs`, or `keywords`.
- Node 26 does not bundle Corepack. pnpm comes from the root `packageManager` field (`pnpm@12.14.0`).

## Decisions already made

These were settled by the owner for this phase. Do not reopen them in your plan.

- **Phase order is swapped.** CI and release (this handoff) come before the core components, so every component lands behind required checks, visual regression, and changesets.
  Components become Phase 6.
- **A local, owner-supervised session writes `.github/` for this handoff.**
  The `CLAUDE.md` rule "the agent never modifies `.github/`" targets the GitHub App bug-fix agent (ADR 0009), whose token has no `workflows` permission.
  The owner reviews every `.github/` file and commits it.
- **The "Version packages" PR is opened with a GitHub App token**, minted per run with `actions/create-github-app-token`.
  PRs opened with `GITHUB_TOKEN` do not trigger CI, so a Version PR opened that way could never pass required checks.
  The App is release-only and separate from the Claude GitHub App. The owner creates it (see "Owner setup").
- **The label-gated AI bug-fix workflow (ADR 0009) is a separate, later handoff.** It builds on the CI from this phase.
- **The packaging smoke test checks the packed tarballs, without a Next.js build.**
  `apps/next-app` already covers `dist/` from server components; the new check covers what the workspace link hides: `files`, the `exports` map, and type resolution from a real install.
- **Visual regression in CI calls `apps/storybook/scripts/visual.ts` unchanged**, with the same pinned `linux/amd64` image.
  GitHub's `ubuntu-24.04` runners are amd64, so there is no emulation in CI.
- **No SaaS** for CI or visual testing, and no Turborepo remote cache. Standard GitHub-hosted runners only.
- **The first release is `0.1.0`.** This handoff adds the changeset for it. Merging the resulting Version PR is the owner's call, after the owner setup below.
- **Changelogs use Changesets' built-in generator.** No `@changesets/changelog-github`.

## In scope

### 1. Package metadata (`packages/*/package.json`)

- Add `description`, `keywords`, `homepage`, `bugs`, and `repository` to `@khee/tokens` and `@khee/react`.
- `repository` is `{ "type": "git", "url": "git+https://github.com/bilegjargal/khee.git", "directory": "packages/<name>" }`.
  npm provenance fails if `repository.url` does not match the publishing repository.
- Change nothing else in the published packages.

### 2. Changesets (`.changeset/`)

- Add `@changesets/cli` as an exact-pinned root devDependency.
- Write `.changeset/config.json` by hand (do not run `changeset init`, which writes a README you do not need), following the schema of the installed version:
  - `fixed: [["@khee/tokens", "@khee/react"]]` (ADR 0006)
  - `access: "public"`, `baseBranch: "main"`, `commit: false`
  - Private workspaces (`@khee/next-app`, `@khee/storybook`) are never versioned or tagged (`privatePackages: { "version": false, "tag": false }`, or the installed version's equivalent)
  - The built-in changelog generator
- Root scripts:
  - `"changeset": "changeset"`
  - `"release": "turbo run build --filter=./packages/* && changeset publish"`
- Add `CHANGELOG.md` files to `.prettierignore`, so generated changelogs never fail `format:check`.
- Add one changeset: a `minor` bump for `@khee/tokens` and `@khee/react` with the summary "Initial release: design tokens and an experimental Button."
  It also covers the metadata change in section 1.

### 3. Packaging check (`scripts/check-pack.ts`)

A root script written in TypeScript and run with Node type stripping, like the other repo scripts, run by a root `check:pack` script.
It assumes `pnpm build` has run and never builds anything itself.

For each publishable package:

1. Run `pnpm pack` into a temporary directory and list the tarball's contents.
2. Fail if any `exports` target, or the `types` file it points to, is missing from the tarball.
3. Fail if the tarball contains test files, stories, `tsconfig*.json`, or `scripts/`.
4. Fail if the packed `package.json` has `install`, `preinstall`, `postinstall`, or `prepare` scripts, or any dependency still written as `workspace:`.
5. Fail if a `sideEffects` entry matches no file in the tarball.

Then, in a temporary directory outside the workspace:

6. Install both tarballs with pnpm, offline from the store `pnpm install` already filled. Do not reach the network.
7. Type-check a fixture that imports `@khee/react` (components and the re-exported types) with `module` and `moduleResolution` set to `NodeNext`.
8. Resolve every CSS entry point (`@khee/tokens/tokens.css`, `@khee/react/components.css`, `@khee/react/reset.css`) with `import.meta.resolve` and fail if any does not resolve.

Unit-test the tarball rules (2 to 5) with `node:test`, next to the script, and wire them into the root lint or test path the way `packages/react/scripts/` does.

### 4. Workflow linting (`pnpm lint:workflows`)

- A root `lint:workflows` script runs [actionlint](https://github.com/rhysd/actionlint) and [zizmor](https://github.com/zizmorcore/zizmor) on `.github/workflows/`.
- Both run as container images, pinned by tag **and** `sha256` digest, like the Playwright image.
  zizmor runs offline (no GitHub token).
- Put the image references in one script (for example `scripts/lint-workflows.ts`) with a clear error when Docker is not running.
- It is not part of `pnpm lint`, so `pnpm lint` keeps working without Docker. CI runs it.
- Fix every finding. Do not suppress any without a comment explaining why, and list every suppression in your summary.

### 5. PR CI (`.github/workflows/ci.yml`)

- Triggers: `pull_request` (any branch) and `push` to `main`. Never `pull_request_target`.
- Top-level `permissions: contents: read`. No job widens it. No secrets are referenced.
- `concurrency` per workflow and ref, cancelling superseded runs on PRs only.
- Runner: `ubuntu-24.04` for every job.
- Every `actions/checkout` sets `persist-credentials: false`.
- Shared setup: `pnpm/action-setup` (version from `packageManager`, not repeated in YAML), `actions/setup-node` with `node-version-file: .nvmrc` and the pnpm cache, then `pnpm install --frozen-lockfile`.

Jobs, each a required-check candidate with a stable name:

- **`checks`**:
  1. `pnpm exec playwright install --with-deps chromium`
  2. `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm format:check`
  3. `pnpm --filter @khee/react check:use-client`, `pnpm --filter @khee/tokens check:contrast`
  4. `pnpm check:pack`
  5. `pnpm lint:workflows`
- **`changeset`** (PRs only): `pnpm changeset status --since=origin/main` with full history.
  Skipped when the head branch is `changeset-release/main`, since the Version PR consumes the changesets.
  Dependabot PRs are not exempt: a dependency bump inside a published package needs a changeset, which the owner adds (see "Upgrading `react-aria-components`" in `CLAUDE.md`).
- **`visual`**:
  - Always runs, so it can be a required check. A first step decides whether visual regression is needed and later steps are skipped when it is not.
  - Needed on every push to `main`, and on PRs that change any of: `packages/react/src/**`, `packages/tokens/tokens.css`, `apps/storybook/**`, the root `package.json`, `pnpm-lock.yaml`, or `ci.yml` itself.
  - Decide this with `git diff --name-only` against the merge base in a shell step. No path-filter Action.
  - Runs `pnpm test:visual`. On failure, uploads `apps/storybook/test-results/` with `actions/upload-artifact`, retained for 7 days, so diffs can be inspected.

### 6. Baseline regeneration (`.github/workflows/visual-baselines.yml`)

- Trigger: `workflow_dispatch` only. `permissions: contents: read`. No secrets.
- Builds, runs `pnpm --filter @khee/storybook test:visual --update-snapshots`, and uploads `apps/storybook/visual/__screenshots__/` as an artifact.
- It never commits or pushes. The owner downloads the artifact and commits baselines by hand when they choose.

### 7. Release (`.github/workflows/release.yml`)

- Trigger: `push` to `main`. `concurrency` group `release`, never cancelled in progress.
- Top-level `permissions: {}`. The single job gets `contents: read` and `id-token: write`, and nothing else.
  This is the only workflow in the repo with `id-token: write`.
- The job runs in a GitHub environment named `release`. The npm trusted publisher and the App secret are bound to it (see "Owner setup").
- Steps:
  1. Mint the App token with `actions/create-github-app-token` from the `RELEASE_APP_ID` environment variable and the `RELEASE_APP_PRIVATE_KEY` environment secret, scoped to this repository.
  2. Checkout with `persist-credentials: false`, setup, and `pnpm install --frozen-lockfile`.
     **No dependency cache** in this workflow (cache poisoning; zizmor checks this).
     Dependency build scripts stay disabled, as `allowBuilds` already sets.
  3. `changesets/action` with `publish: pnpm release` and the App token as its GitHub token.
     It opens or updates the "Version packages" PR when changesets exist, and publishes when that PR is merged.
- Publishing uses npm trusted publishing (OIDC) with provenance. No npm token exists anywhere, and none is referenced.
  Confirm, from the docs of the installed versions, that `changeset publish` with pnpm `12.14.0` and the npm CLI shipped with Node 26 publishes with OIDC and provenance. Put what you found in your plan.

### 8. Dependabot (`.github/dependabot.yml`)

- Ecosystems: `npm` (the root, covering the whole pnpm workspace) and `github-actions`.
- Weekly schedule, and `cooldown` of 14 days so updates respect the 14-day rule.
- Group tooling updates to keep PR volume low, but keep `react-aria-components` in its own ungrouped PR, since every upgrade is a Khee release with its own changeset.
- Keep every `storybook`, `@storybook/*`, and `eslint-plugin-storybook` package in one group, since they must share a version.
  Do the same for `vitest` and `@vitest/*`, and for `playwright` and `@playwright/test`.
- A `playwright` bump also needs the image tag and digest in `visual.ts` changed. Dependabot cannot do that, so note it in a comment in `dependabot.yml`; `visual.ts` already fails loudly on a mismatch.

### 9. CODEOWNERS (`.github/CODEOWNERS`)

- The owner (`@bilegjargal`) owns `/.github/` and `/.changeset/config.json`.

## Allowed dependencies

Look up every version with `npm view`, check peer ranges, and respect the 14-day rule.

**Root devDependencies (exact pins)**

- `@changesets/cli`: versioning, changelogs, and publishing. At the time of writing that is `3.0.3`.

**GitHub Actions (each pinned to a full 40-character commit SHA, with the version tag in a trailing comment)**

- `actions/checkout`
- `actions/setup-node`
- `pnpm/action-setup`
- `actions/upload-artifact`
- `changesets/action`
- `actions/create-github-app-token`

Resolve each SHA from the release tag yourself, use a release at least 14 days old, and list tag, SHA, and release date in your plan.

**Container images (not npm dependencies, pinned by tag and `sha256` digest)**

- `rhysd/actionlint`
- `ghcr.io/zizmorcore/zizmor`

Anything else, including any other Action or a path-filter Action: stop and ask.

## Owner setup (not for the agent)

The agent never changes repository, organization, or npm settings.
List these in your summary as the owner's checklist, in this order:

1. Create a GitHub App for releases, installed on this repository only, with `contents: write` and `pull_requests: write`, and nothing else (no `workflows`, no administration).
2. Create the `release` environment, restricted to `main`. Store `RELEASE_APP_ID` as an environment variable and `RELEASE_APP_PRIVATE_KEY` as an environment secret.
3. Bootstrap both packages on npm and configure trusted publishing for workflow `release.yml` and environment `release`. Check npm's current docs on whether a package must exist before a trusted publisher can be added.
4. Protect `main`: required reviews, the CI job names as required checks, no force pushes, no bypass actors other than the owner. The release App is not a bypass actor.
5. Enable Dependabot alerts and security updates.

## Out of scope

- The label-gated AI bug-fix workflow (ADR 0009): a later handoff
- Any component work, including Button's docs content and `stable` review (Phase 6)
- Publishing Storybook (GitHub Pages or similar)
- A Next.js build against the packed tarballs
- Turborepo remote caching, or caching `.turbo/` or Playwright browsers in CI
- pnpm `minimumReleaseAge`
- `CONTRIBUTING.md`
- Merging the Version PR, or publishing anything
- Editing `README.md`, `CLAUDE.md`, ADRs, or handoffs. If the root README no longer matches (for example the v0.1 roadmap checkboxes), list it in your summary.

## Acceptance criteria

### Local

All must exit 0 from a fresh clone, run from the repo root, with the Docker daemon running.
Paste outputs in your summary.

```bash
# clean install and browser
rm -rf node_modules && pnpm install --frozen-lockfile
pnpm exec playwright install chromium

# pipeline
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm format:check
pnpm build | grep -q "FULL TURBO"

# packaging, workflow lint, changesets
pnpm check:pack
pnpm lint:workflows
pnpm changeset status

# a missing exports target fails the packaging check
mv packages/react/dist/reset.css packages/react/dist/reset.css.bak
! pnpm check:pack
mv packages/react/dist/reset.css.bak packages/react/dist/reset.css

# an install script in a published package fails the packaging check
cp packages/react/package.json packages/react/package.json.bak
node -e "const f='packages/react/package.json';const j=require('./'+f);j.scripts.postinstall='node -e 0';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
! pnpm check:pack
mv packages/react/package.json.bak packages/react/package.json

# fixed group, public access, private apps never versioned
node -e "const c=require('./.changeset/config.json');const f=JSON.stringify(c.fixed);if(!f.includes('@khee/tokens')||!f.includes('@khee/react')||c.access!=='public'||c.baseBranch!=='main')process.exit(1)"

# provenance needs a matching repository field
node -e "for(const p of ['tokens','react']){const r=require('./packages/'+p+'/package.json').repository;if(!r||!/github\.com\/bilegjargal\/khee/.test(r.url)||r.directory!=='packages/'+p)process.exit(1)}"

# every Action is pinned to a full commit SHA
! grep -rhE '^\s*-?\s*uses:' .github/workflows | grep -vE 'uses: [^@]+@[0-9a-f]{40}( |$)'

# every workflow declares top-level permissions, none uses pull_request_target
for f in .github/workflows/*.yml; do grep -qE '^permissions:' "$f" || exit 1; done
! grep -rq 'pull_request_target' .github/workflows

# only the release workflow can mint an OIDC token, and no workflow references an npm token
test "$(grep -rl 'id-token: write' .github/workflows)" = ".github/workflows/release.yml"
! grep -rqiE 'NPM_TOKEN|NODE_AUTH_TOKEN' .github/workflows

# the release workflow has no dependency cache
! grep -qE 'cache:|actions/cache' .github/workflows/release.yml

# Dependabot covers npm and Actions with a 14-day cooldown
grep -q 'package-ecosystem: "\?npm' .github/dependabot.yml
grep -q 'package-ecosystem: "\?github-actions' .github/dependabot.yml
grep -qE 'default-days: 14' .github/dependabot.yml

# CODEOWNERS covers .github
grep -qE '^/\.github/\s+@bilegjargal' .github/CODEOWNERS

# the tree is clean and nothing ignored got committed
git diff --exit-code && test -z "$(git status --porcelain)"
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo|\.next|storybook-static|test-results|playwright-report)/')"
```

### On GitHub

This phase lands as a PR, not directly on `main`, so CI proves itself on its own PR.
Paste the output of each command.

```bash
# every CI job passes on the handoff PR, including visual (the PR touches ci.yml)
gh pr checks <pr-number> --watch

# a docs-only PR runs the visual job but skips the regression steps (close it afterwards)
# a one-token CSS change fails the visual job and uploads the diff artifact (close it afterwards)
gh run view <run-id> --log | grep -E 'visual'

# after the owner merges: the release workflow opens the "Version packages" PR with the App token,
# and CI runs on it
gh pr list --head changeset-release/main
gh pr checks <version-pr-number>
```

The last block depends on owner setup steps 1 and 2. If they are not done yet, say so and stop there.

## Stop and ask triggers (task specific)

- A needed Action, image, or package is not on the allowed list, or an allowed one has no release at least 14 days old
- `changeset publish` cannot publish with OIDC and provenance through pnpm `12.14.0`, or would need an npm token
- Dependabot does not support pnpm `12.14.0` lockfiles, or `cooldown`
- The offline tarball install needs network access
- actionlint or zizmor reports a finding you cannot fix without weakening a rule in `CLAUDE.md` or ADR 0008
- Visual regression passes locally but fails in CI with no code change, or differs between two CI runs (flakiness). Do not raise thresholds to hide it.
- Any check needs `continue-on-error`, `if: always()` on a gating step, or a skipped required check to pass

## Commits

Suggested sequence:

1. `build: add package metadata for provenance`
2. `build: set up changesets with a fixed release group`
3. `test: add packed tarball check`
4. `ci: add workflow linting`
5. `ci: add pr checks and visual regression`
6. `ci: add visual baseline regeneration`
7. `ci: add release workflow with trusted publishing`
8. `ci: add dependabot and codeowners`
9. `chore: add changeset for the initial release`
