# Tasks

Working task list derived from the README roadmap, `CLAUDE.md`, the ADRs in `docs/decisions/`, and the current state of the repo.
The README describes the target end state; this file tracks how far we are from it.
Each phase below should get its own handoff in `docs/handoffs/` before work starts.

Last reviewed: 2026-11-19

## Current stage

**Phases 1 (workspace skeleton) and 2 (tokens) are done.** Tokens merged in [PR #4](https://github.com/bilegjargal/khee/pull/4).
**Phase 3 (React package) is done.**
**Phase 4 (Storybook) is done**, committed directly to `main`.
**Phase 5 (CI and release) is done.** Merged in [PR #5](https://github.com/bilegjargal/khee/pull/5).
**`0.1.0` is published** to npm with provenance, released on 2026-11-18 through the Version PR [#8](https://github.com/bilegjargal/khee/pull/8).
Architecture decisions (ADR 0001 to 0011) are recorded.
**Next: Phase 6 (core components)**, specified in [handoff 06](docs/handoffs/06-core-components.md) and delivered as six sequential PRs.
On 2026-11-09 the owner swapped the last two phases, so core components come after CI and release.

Verified on 2026-11-05, on `main`:

- Node `v26.5.0` matches `.nvmrc` (`26`), pnpm `12.14.0` matches `packageManager`.
- Every acceptance command in handoffs 03 and 04 passes from a fresh clone.
- `@khee/tokens` is a CSS-only package with `tokens.css`, a contrast check, and Stylelint token rules.
- `@khee/react` builds with plain `tsc`, ships Button (experimental), and is tested in Vitest browser mode.
- `apps/next-app` renders Button from server components.
- `apps/storybook` runs Storybook 10 with theme and direction toolbars, a docs page template, and status badges.
- Every story runs in Vitest browser mode with axe (`pnpm test:a11y`). Visual regression runs in a pinned, digest-locked Playwright image (`pnpm test:visual`).
- No `.github/`, `.changeset/`, `CONTRIBUTING.md`, or components other than Button yet.

## Before Phase 2: reconcile the plan with the ADRs

Handoff 01 was written before the ADRs and describes later phases differently from what was decided.
These need an owner decision or a new handoff, not a silent fix.

- [x] Write handoffs 02 to 06. Handoff 01's out-of-scope list mentions "Style Dictionary, or any token build" for Phase 2 and "tsup or Vite library build" for Phase 3, which contradict ADR 0003 (hand-written `tokens.css`, no build) and ADR 0007 (plain `tsc`).
- [x] Switch published packages to `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` (ADR 0007). Each package overrides it; the base keeps `ESNext` and `bundler`, which `apps/next-app` uses.
- [x] Remove the JavaScript placeholder from `@khee/tokens`. ADR 0006 says it has no JavaScript runtime, so its `exports` should point to `tokens.css` only, and its `build`, `lint`, and `typecheck` scripts need rethinking.
- [x] Decide the order of the components and CI phases. Decided 2026-11-09: CI and release is Phase 5 (it completes roadmap v0.1), core components are Phase 6, so every component lands behind required checks.
- [x] Minor: ADR 0008 says "no bypass for bots or apps", while `CLAUDE.md` says "no bypass actors other than the owner". Resolved 2026-11-17: the owner's admin role is the only bypass actor, for pull requests only; no bot or App can bypass.

## v0.1: Foundations

### Phase 2: Tokens (`@khee/tokens`)

Merged in PR #4.

- [x] Hand-write `packages/tokens/tokens.css` in the `khee.tokens` cascade layer.
- [x] Palette tier: raw color scales (`gray`, `blue`, `red`, 50 to 950). Spacing, radii, typography, shadows, and durations are semantic tokens with direct values instead, per handoff 02.
- [x] Semantic tier: 29 names (`--khee-color-primary`, `--khee-color-on-primary`, `--khee-color-surface`, `--khee-color-border`, `--khee-radius-md`, ...).
- [x] Light theme as the default, dark theme under `[data-theme="dark"]`.
- [x] Document foreground/background semantic pairs that must meet WCAG 2.2 AA contrast (`contrast-pairs.json`).
- [x] `package.json`: `exports` for `./tokens.css`, `sideEffects` listing only CSS, copy CSS to `dist/` as-is, no install scripts.
- [x] Stylelint config that flags any `var(--khee-*)` not defined in `tokens.css`, enforces logical properties, and the `khee` prefix.
- [x] Contrast check script for every documented pair in every theme, runnable locally (`pnpm --filter @khee/tokens check:contrast`). CI wiring comes in Phase 5.
- [x] Package README for `@khee/tokens`.

Follow-ups from Phase 2:

- [ ] Owner decision: light theme has no pure white, so `surface` is `gray-50` (#fcfcfd) on a `gray-100` page background.
- [x] Phase 6: consider a softer divider token, since `--khee-color-border` must reach 3:1 and is a mid gray. In handoff 06 (`--khee-color-border-subtle`, Card PR).
- [ ] Add `tsconfig.base.json` as a Turborepo `typecheck` input, so base config edits do not replay cached results.
- [ ] Consider pnpm `minimumReleaseAge` to enforce the 14-day dependency rule automatically.

### Phase 3: React package setup (`@khee/react`)

Done.

- [x] Add `react-aria-components` as an exact-pinned `dependency` (ADR 0010).
- [x] Add `react` and `react-dom` as caret-ranged `peerDependencies`.
- [x] NodeNext build with plain `tsc`, explicit `.js` extensions, one emitted file per module.
- [x] `exports` map for `.`, `./components.css`, and `./reset.css`; `sideEffects` lists only CSS.
- [x] `components.css` entry in `khee.components` and optional `reset.css` in `khee.reset`, both copied to `dist/` as-is.
- [x] Re-export common React Aria types: `PressEvent`, `Key`, `Selection`.
- [x] Shared helper for merging consumer `className`, including the render-function form. `style` passes through untouched, per handoff 03.
- [x] React hooks ESLint plugin. No JSX a11y plugin, per handoff 03.
- [x] Vitest browser mode (Playwright, headless Chromium) for unit and keyboard interaction tests.
- [x] Check that every emitted `dist/` file for an interactive component starts with `"use client"`.
- [x] Private `apps/next-app` (Next.js App Router) that renders components from a server component.
- [x] Button as the pilot component, marked `experimental`.
- [x] Stylelint `khee/require-layer` rule and hardcoded value bans for component CSS.

Follow-ups from Phase 3:

- [x] No `peerDependency` from `@khee/react` on `@khee/tokens`. Matching versions are the compatibility rule (ADR 0006).
- [x] Phase 6: revisit secondary Button hover and pressed. Hover now fills with `background`; pressed also takes a `text` border (handoff 06, PR 1).
- [x] Phase 5: CI must run `pnpm exec playwright install chromium` before `pnpm test`.

### Phase 4: Storybook (`apps/storybook`)

Done.

- [x] Install and configure Storybook for React, replacing the placeholder. Storybook 10.6.3 with `@storybook/react-vite`, configured by hand, rendering the packages from source.
- [x] Theme switcher toolbar (light, dark) driven by `data-theme`. Docs pages switch Storybook's own docs theme too.
- [x] LTR/RTL toggle driven by `dir`.
- [x] Every story rendered in Vitest browser mode with axe; any violation fails, wired to `pnpm test:a11y`. CI wiring comes in Phase 5.
- [x] `pnpm dev` runs Storybook, as the README states.
- [x] Docs page template with keyboard behavior and ARIA notes sections, fed by typed `parameters.kheeDocs`.
- [x] `experimental` / `stable` status badges, with a check that each component has exactly one status tag.
- [x] Playwright visual regression against stories, with the browser in the pinned `linux/amd64` Playwright image. Baselines are committed.
- [x] Forced colors (screenshots), 200% zoom and 320px reflow (screenshots and no horizontal overflow), text at 200%, and `prefers-reduced-motion` checks.

Follow-ups from Phase 4:

- [x] Phase 6: Button's keyboard and ARIA docs content (handoff 06, PR 1). The `stable` review waits for the v1.0 screen reader passes (owner decision, 2026-11-19).
- [x] Phase 6: Button's JSDoc says "Status: experimental.", which repeats the docs page badge. Removed in handoff 06, PR 1.
- [x] Phase 5: run visual regression in CI through `apps/storybook/scripts/visual.ts`, unchanged, with the same pinned `linux/amd64` image.
- [x] Phase 5: a `workflow_dispatch` job that regenerates baselines and uploads them as an artifact, as a fallback source of truth.
- [x] Phase 5: a smoke test of the built packages: packed tarball checks with an offline install and a NodeNext type-check, no Next.js build.
- [ ] Handoff template: the `pnpm dev` acceptance check uses `pkill -f "storybook dev"`, which leaves `turbo run dev` running.
- [x] Owner decision: the Playwright container runs `npx playwright@<exact version> run-server` from npm on each run. Accepted; no derived image.
- [ ] Upstream: Storybook's CLI prints a `module.register()` deprecation warning on Node 26.

### Phase 5: CI and release

Merged in PR #5. `0.1.0` published on 2026-11-18.

- [x] PR workflow: lint, typecheck, build (includes the Next.js app), test (includes a11y), format, `"use client"` check, contrast check, packaging check, changeset check.
- [x] Visual regression job, always present as a required check, running the suite only when CSS, components, or stories change.
- [x] `workflow_dispatch` baseline regeneration that uploads screenshots as an artifact.
- [x] Read-only `permissions:`, no secrets, no `pull_request_target`, every Action pinned to a full commit SHA, linted with actionlint and zizmor.
- [x] Dependency caching on standard GitHub-hosted runners (not in the release workflow).
- [x] `package.json` metadata for published packages, including a `repository` field that npm provenance requires.
- [x] Changesets with `@khee/tokens` and `@khee/react` in a `fixed` group, and a changeset for the `0.1.0` initial release.
- [x] Release workflow on `main`: Changesets "Version packages" PR opened with a release-only GitHub App token (so CI runs on it), npm trusted publishing with provenance, `id-token: write` only there, in a `release` environment.
- [x] Dependabot for npm and GitHub Actions, with a 14-day cooldown.
- [x] `CODEOWNERS` requiring the owner on `.github/`.
- [x] Owner-only: release GitHub App, `release` environment, npm bootstrap and trusted publisher setup, branch protection on `main`, 2FA, CodeRabbit.

Follow-ups from Phase 5:

- [ ] npm trusted publisher entries allow only `npm stage publish` by default. Any new published package needs "Allow npm publish" ticked, or its first publish fails with `403 OIDC permission denied`. Consider adding this to handoff 05's "Owner setup" (owner decision, since handoffs are not edited without approval).

Deferred to a later handoff:

- [ ] Label-gated AI bug-fix workflow (ADR 0009), running only on the owner's label event, with the Claude GitHub App permissions it needs.

## v0.2: Core components (Phase 6)

Each component ships with stories for every variant, size, and state, unit and keyboard interaction tests, zero axe violations, visual regression screenshots, a docs section on keyboard and ARIA behavior, an exported props type, forwarded refs, and `"use client"` where interactive.
Specified in [handoff 06](docs/handoffs/06-core-components.md), as six PRs merged in order. `0.2.0` ships after PR 6.
Owner decisions (2026-11-19): components stay `experimental` until v1.0, no `danger` Button variant, light `surface` stays `gray-50` until the token review, and non-interactive components are plain elements rendered as server components (ADR 0011).

- [x] PR 1: Button (docs content, JSDoc, secondary states, docs content check)
- [x] PR 2: Card, plus `--khee-color-border-subtle`
- [ ] PR 3: Field parts and TextField, plus ADR 0012
- [ ] PR 4: Dialog, plus portal support in the visual suite
- [ ] PR 5: Select, Popover, and ListBox
- [ ] PR 6: review the semantic token set against these five and adjust before adding more components

## v0.3: Form controls

- [ ] IconButton
- [ ] Link
- [ ] TextArea
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] ComboBox

## v0.4: Overlays and feedback

- [ ] Popover
- [ ] Tooltip
- [ ] Menu
- [ ] Toast
- [ ] Alert
- [ ] Badge
- [ ] Spinner

## v1.0: Stable

- [ ] Manual screen reader passes (VoiceOver, NVDA) for every component, then mark it `stable`.
- [ ] Documented migration guide.

## Docs and repo housekeeping

- [ ] `CONTRIBUTING.md` (short guide, required by `CLAUDE.md`).
- [ ] Root README Theming example uses `--khee-radius-md: 10px` (tokens use `rem`) and overrides `primary` without `primary-hover`.
- [ ] README placeholders: Storybook and npm links are `#`. The npm packages now exist, and Changesets created the package changelogs on the `0.1.0` release.
- [ ] README roadmap: the v0.1 boxes are unchecked although v0.1 is done.
- [ ] `CLAUDE.md`: "Components are thin wrappers" should mention the ADR 0011 exception for non-interactive components.
- [x] README lists `pnpm test:a11y` and a `dev` script that runs Storybook. Both work since Phase 4.
- [x] `package.json` metadata for published packages: `description`, `repository`, `homepage`, `bugs`, `keywords`.
