# Tasks

Working task list derived from the README roadmap, `CLAUDE.md`, the ADRs in `docs/decisions/`, and the current state of the repo.
The README describes the target end state; this file tracks how far we are from it.
Each phase below should get its own handoff in `docs/handoffs/` before work starts.

Last reviewed: 2026-11-05

## Current stage

**Phases 1 (workspace skeleton) and 2 (tokens) are done.** Tokens merged in [PR #4](https://github.com/bilegjargal/khee/pull/4).
**Phase 3 of 6 (React package) is done.**
Architecture decisions (ADR 0001 to 0010) are recorded and the README is aligned with them.

Verified on 2026-11-05, on `main`:

- Node `v26.5.0` matches `.nvmrc` (`26`), pnpm `12.14.0` matches `packageManager`.
- Every acceptance command in handoff 03 passes from a fresh clone.
- `@khee/tokens` is a CSS-only package with `tokens.css`, a contrast check, and Stylelint token rules.
- `@khee/react` builds with plain `tsc`, ships Button (experimental), and is tested in Vitest browser mode.
- `apps/next-app` renders Button from server components.
- `@khee/storybook` is still a placeholder.
- No `.github/`, `.changeset/`, `CONTRIBUTING.md`, or components other than Button yet.

## Before Phase 2: reconcile the plan with the ADRs

Handoff 01 was written before the ADRs and describes later phases differently from what was decided.
These need an owner decision or a new handoff, not a silent fix.

- [ ] Write handoffs 02 to 06. Handoffs 02 and 03 are committed; 04 to 06 remain. Handoff 01's out-of-scope list mentions "Style Dictionary, or any token build" for Phase 2 and "tsup or Vite library build" for Phase 3, which contradict ADR 0003 (hand-written `tokens.css`, no build) and ADR 0007 (plain `tsc`).
- [x] Switch published packages to `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` (ADR 0007). Each package overrides it; the base keeps `ESNext` and `bundler`, which `apps/next-app` uses.
- [x] Remove the JavaScript placeholder from `@khee/tokens`. ADR 0006 says it has no JavaScript runtime, so its `exports` should point to `tokens.css` only, and its `build`, `lint`, and `typecheck` scripts need rethinking.
- [ ] Decide the order of Phase 5 (components) and Phase 6 (CI and release). Roadmap v0.1 includes CI and the release pipeline, but Handoff 01 numbers them last, after components.
- [ ] Minor: ADR 0008 says "no bypass for bots or apps", while `CLAUDE.md` says "no bypass actors other than the owner". Confirm they mean the same thing.

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
- [x] Contrast check script for every documented pair in every theme, runnable locally (`pnpm --filter @khee/tokens check:contrast`). CI wiring comes in Phase 6.
- [x] Package README for `@khee/tokens`.

Follow-ups from Phase 2:

- [ ] Owner decision: light theme has no pure white, so `surface` is `gray-50` (#fcfcfd) on a `gray-100` page background.
- [ ] Phase 5: consider a softer divider token, since `--khee-color-border` must reach 3:1 and is a mid gray.
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
- [ ] Phase 5: revisit secondary Button hover and pressed (`background` fill, `text` border). Accepted for now; handoff 03 did not specify them.
- [ ] Phase 6: CI must run `pnpm exec playwright install chromium` before `pnpm test`.

### Phase 4: Storybook (`apps/storybook`)

- [ ] Install and configure Storybook for React, replacing the placeholder.
- [ ] Theme switcher toolbar (light, dark) driven by `data-theme`.
- [ ] LTR/RTL toggle driven by `dir`.
- [ ] a11y addon with zero violations enforced in CI, wired to `pnpm test:a11y`.
- [ ] `pnpm dev` runs Storybook, as the README states.
- [ ] Docs page template with keyboard behavior and ARIA notes sections.
- [ ] `experimental` / `stable` status badges.
- [ ] Playwright visual regression against stories, run inside Docker for stable font rendering.
- [ ] Forced-colors, 200% zoom, and `prefers-reduced-motion` coverage in stories or tests.

### Phase 6: CI and release

- [ ] PR workflow: lint, typecheck, test, a11y, `"use client"` check, contrast check (`check:contrast` exists), Next.js app build.
- [ ] Visual regression workflow, run only when CSS, components, or stories change.
- [ ] Read-only `permissions:`, no secrets, no `pull_request_target`, every Action pinned to a full commit SHA.
- [ ] Dependency caching on standard GitHub-hosted runners.
- [ ] Changesets with `@khee/tokens` and `@khee/react` in a `fixed` group.
- [ ] Release workflow on `main`: Changesets "Version packages" PR, npm trusted publishing with provenance, `id-token: write` only there.
- [ ] Dependabot for npm and GitHub Actions.
- [ ] `CODEOWNERS` requiring the owner on `.github/`.
- [ ] Label-gated AI bug-fix workflow (ADR 0009), running only on the owner's label event.
- [ ] Owner-only: branch protection on `main`, npm trusted publisher setup, 2FA, CodeRabbit, Claude GitHub App permissions.

## v0.2: Core components (Phase 5)

Each component ships with stories for every variant, size, and state, unit and keyboard interaction tests, zero axe violations, visual regression screenshots, a docs section on keyboard and ARIA behavior, an exported props type, forwarded refs, and `"use client"` where interactive.

- [ ] Button
- [ ] TextField
- [ ] Dialog
- [ ] Select
- [ ] Card
- [ ] Review the semantic token set against these five and adjust before adding more components.

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
- [ ] README placeholders: Storybook and npm links are `#`, and the Changelog link points to a `CHANGELOG.md` that Changesets will create on the first release.
- [ ] README lists `pnpm test:a11y` and a `dev` script that runs Storybook; neither works yet.
- [ ] `package.json` metadata for published packages: `description`, `repository`, `homepage`, `bugs`, `keywords`.
