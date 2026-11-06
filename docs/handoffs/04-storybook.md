# Handoff 04: Storybook

**Phase:** 4 of 6
**Goal:** `apps/storybook` is the component playground and test harness: Storybook for React with theme and direction toolbars, every story checked by axe in a real browser, a docs page template, status badges, and Playwright visual regression run against a Dockerized browser.
Button is the pilot again: its stories exercise every part of the pipeline.

Read `CLAUDE.md`, handoff 03, and ADRs 0002, 0003, 0004, and 0008 first.
Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Phases 1 to 3 are complete.
- `@khee/react` ships Button (`experimental`), `components.css`, and `reset.css`, built with plain `tsc`.
- Vitest browser mode (Playwright provider, headless Chromium) runs `@khee/react` tests. `vitest`, `vite`, `@vitest/browser-playwright`, and `playwright` are exact-pinned root devDependencies.
- `apps/next-app` renders Button from server components.
- `@khee/storybook` is a placeholder: `src/index.ts` exports a constant and the app builds it with `tsc`.
- The root `dev` script runs `turbo run dev`, but no workspace has a `dev` script.
  The README documents `pnpm dev` (Storybook) and `pnpm test:a11y`; neither works yet.

## Decisions already made

These were settled by the owner for this phase. Do not reopen them in your plan.

- **Storybook 10 with `@storybook/react-vite`.** Vite is already in the repo, and React Aria needs no special handling.
- **Configure Storybook by hand.** Do not run `storybook init`, `storybook add`, or `npx storybook@latest ...`: they install packages and rewrite files outside your control.
- **Stories live in `apps/storybook/stories/`, not next to components.** `@khee/react` publishes `src/`, so co-located stories would ship to npm and pull Storybook types into the package.
- **Storybook renders the packages from source.** `viteFinal` aliases `@khee/react` to `packages/react/src/index.ts`, and the three CSS entry points to their `src` files, so `pnpm dev` has hot reload without a watch build.
  The published `dist/` output stays covered by the Next.js app and the checks from handoff 03. CSS in `dist/` is byte-identical to `src/`.
- **Axe runs through `@storybook/addon-vitest`** in Vitest browser mode, reusing the Phase 3 setup.
  Every story is rendered, its `play` function runs, and any axe violation fails the test (`parameters.a11y.test: "error"`, set globally).
  There is no separate test runner and no `@storybook/test-runner`.
- **Visual regression uses `@playwright/test` against the static Storybook build, with the browser running in Docker.**
  The test runner stays on the host. The official Playwright image runs `playwright run-server`, and tests connect with `connectOptions.wsEndpoint` and `exposeNetwork: "<loopback>"`.
  Only the browser runs in the container, so no `node_modules` are shared across operating systems and fonts render the same everywhere.
- **No SaaS visual testing** (no Chromatic, Percy, or Argos). Baseline screenshots are committed to the repo.
- **Theme and direction toolbars use Storybook's built-in `globalTypes`.** No `@storybook/addon-themes`.
- **Dark theme and RTL get explicit stories**, set with story-level `globals`, so axe and visual regression cover them on every run instead of depending on the toolbar state.
- **Button's keyboard and ARIA docs content stays in Phase 5**, as handoff 03 decided. This phase builds the template that will hold it.

## In scope

### 1. Replace the placeholder (`apps/storybook`)

- Delete `src/` and the `exports` field. `@khee/storybook` stays `"private": true`.
- Dependencies on `@khee/react` and `@khee/tokens` via `workspace:*`.
- One `tsconfig.json` for the app: `module`/`moduleResolution` `NodeNext`, `jsx: "react-jsx"`, `lib` with `DOM` and `DOM.Iterable`, `types: ["node"]`, `noEmit`.
  It includes `.storybook/`, `stories/`, `visual/`, and the config files at the app root, so ESLint's project service finds it for every file.
  This app is private and never published, so mixing Node and DOM types here is acceptable.
- Package scripts:
  - `dev`: `storybook dev --port 6006 --no-open`
  - `build`: `storybook build --output-dir storybook-static --quiet`. Not `--test`, since visual regression needs the full build.
  - `lint`: ESLint and Stylelint
  - `typecheck`: `tsc`
  - `test`: `vitest run` (story rendering, interactions, axe)
  - `test:visual`: the Docker-backed Playwright suite (section 7)
- Telemetry and update checks are off in `.storybook/main.ts` (`core.disableTelemetry`, `core.disableWhatsNewNotifications`), so builds make no network calls.

### 2. Storybook config (`apps/storybook/.storybook/`)

- `main.ts`:
  - `framework: "@storybook/react-vite"`, `stories: ["../stories/**/*.stories.tsx"]`.
  - `addons`: `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`. Nothing else.
  - `viteFinal` adds the source aliases described above. Exact-match aliases only, so `@khee/react/components.css` does not resolve into `index.ts`.
- `preview.tsx`:
  - Imports, in order: `@khee/tokens/tokens.css`, `@khee/react/reset.css`, `@khee/react/components.css`, then `./preview.css`.
  - `globalTypes`:
    - `theme`: `light` (default), `dark`. Sets `data-theme` on `document.documentElement`; `light` removes the attribute.
    - `direction`: `ltr` (default), `rtl`. Sets `dir` on `document.documentElement`.
  - Both are applied in a decorator. They also apply on docs pages.
  - `parameters.a11y.test: "error"`, so every story fails on any axe violation.
  - `parameters.layout: "centered"`.
  - `tags: ["autodocs"]`, so every component gets a docs page.
- `preview.css`: canvas styles only (`body` background, text color, and font from semantic tokens), inside `@layer khee.storybook { ... }` so `khee/require-layer` passes.
  No hardcoded values.
- `vitest.setup.ts`, if Storybook 10 still needs it for the project annotations; follow the `@storybook/addon-vitest` docs for the version you install.

### 3. Docs page template and status badges

- `.storybook/docs-page.tsx`, set as `parameters.docs.page`. It renders, in order:
  1. The title and a status badge
  2. The component description
  3. The primary story and its controls
  4. A **Keyboard** section: a table of keys and actions
  5. An **ARIA** section: a list of notes
  6. The remaining stories
- Keyboard and ARIA content comes from typed story parameters on the component's meta, for example `parameters.kheeDocs = { keyboard: [{ keys: "Enter", action: "..." }], aria: ["..."] }`.
  Export the parameter type from `.storybook/` so story files are type-checked.
  When the content is missing, the section renders a visible "Not documented yet" notice instead of disappearing.
- **Status badges:** each component's meta has exactly one tag, `experimental` or `stable`. The badge reads it.
  The badge has an accessible text label and meets contrast in both themes. It uses semantic tokens only.
- `stories/check-status-tags.test.ts` (`node:test`): reads `storybook-static/index.json` and fails if any component lacks a status tag or has both.
  It runs after `build`, so wire it into the app's `test` script after Vitest and make sure Turborepo's `test` task depends on the app's own `build` (`"dependsOn": ["^build", "build"]` for this workspace, or an equivalent package-level `turbo.json`).

### 4. Button stories (`stories/button.stories.tsx`)

- Meta: `title: "Components/Button"`, `component: Button`, tags `["experimental"]`, and `argTypes` for `variant` and `size`.
- Stories, at least:
  - `Primary`, `Secondary`
  - `Sizes`: `sm` and `md` side by side
  - `Disabled`: both variants
  - `LongLabel`: a long translated label (for example German), showing the button grows with no fixed width
  - `Dark`: every variant and size, with `globals: { theme: "dark" }`
  - `Rtl`: every variant, with `globals: { direction: "rtl" }`, and a label in a right-to-left language
  - `KeyboardPress`: a `play` function that tabs to the button, presses Enter and Space, and asserts the `onPress` spy (`fn()` from `storybook/test`) was called twice
- Event props use `fn()`, so the Actions panel shows presses.

### 5. Storybook Vitest project (`apps/storybook/vitest.config.ts`)

- `storybookTest({ configDir: ".storybook" })` plugin, browser mode with the Playwright provider, headless Chromium, `screenshotFailures: false`.
- Every story is a test. Any axe violation, `play` failure, or render error fails the run.
- Root `package.json` gets `"test:a11y": "turbo run test --filter=@khee/storybook"`, which the README already documents.

### 6. Reduced motion and zoom checks

These live in the Playwright suite (section 7), so they run in the same Dockerized browser.

- **Reduced motion:** with `reducedMotion: "reduce"`, for every story, every element inside `#storybook-root` has a computed `transition-duration` and `animation-duration` of `0s`.
- **200% zoom:** with a 640 by 400 viewport (1280 CSS pixels at 200% zoom), every story has no horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`) and gets a screenshot.
- **Text at 200%:** with `html { font-size: 200% }` injected, every story's interactive elements are not clipped (`scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`).
  Tokens use `rem`, so this proves components scale with user font settings.
- **Forced colors:** a Playwright project with `forcedColors: "active"` screenshots every story.

### 7. Visual regression (`apps/storybook/visual/`)

- `playwright.config.ts` at the app root:
  - `testDir: "visual"`, Chromium only, `fullyParallel`, no retries locally.
  - `webServer` serves `storybook-static/` with `vite preview` (Vite is already a root dependency), on a fixed port, `reuseExistingServer: false`.
  - `use.connectOptions`: `wsEndpoint` from an environment variable with a `ws://127.0.0.1:3000/` default, and `exposeNetwork: "<loopback>"`.
  - Projects: `default`, `forced-colors`, `zoom-200`. Reduced motion and text scaling are assertions, not screenshot projects.
  - `snapshotPathTemplate` under `visual/__screenshots__/`, with no OS suffix, since the browser always runs in the same Linux image.
- `visual/stories.spec.ts` reads `storybook-static/index.json`, generates one test per story, opens `iframe.html?id=<id>&viewMode=story`, waits for fonts and the story to render, and screenshots `#storybook-root`.
  Stories with the `interactive` tag also get a hovered and a keyboard-focused screenshot. Button's meta gets the `interactive` tag.
- `scripts/visual.ts` (Node type stripping, like the other repo scripts), run by `test:visual`:
  1. Checks Docker is running, with a clear error if not.
  2. Starts the Playwright image with `run-server` on port 3000, bound to `127.0.0.1` only.
  3. Runs `playwright test` with any extra arguments passed through (for example `--update-snapshots`).
  4. Always stops and removes the container, even when tests fail or the process is interrupted.
- The image is the official `mcr.microsoft.com/playwright` image at **exactly** the root `playwright` version, Ubuntu noble, pinned by tag **and** `sha256` digest.
  Look up the digest yourself (`docker buildx imagetools inspect`) and put it in your plan.
  `run-server` uses `playwright` at the same exact version.
- Baselines are generated with `pnpm --filter @khee/storybook test:visual --update-snapshots` and committed.
- Add `test-results/` and `playwright-report/` to `.gitignore` and `.prettierignore`.

### 8. ESLint, Turborepo, and root scripts

- Add `eslint-plugin-storybook` with its flat recommended config for `apps/storybook/stories/**`.
- Turborepo:
  - `build` outputs include `storybook-static/**`.
  - `dev` stays uncached and persistent. It needs no `^build`, since Storybook renders from source.
  - Add a `test:visual` task: uncached, depends on the app's own `build`.
- Root `package.json`: `test:a11y` (section 5) and `"test:visual": "turbo run test:visual"`.
  `pnpm test` does **not** run visual regression, so it keeps working without Docker.

## Allowed dependencies

Look up every version with `npm view`, check peer ranges, and respect the 14-day rule.
All `storybook` and `@storybook/*` packages, and `eslint-plugin-storybook`, use the **same** exact version.
At the time of writing that is `10.6.3`; `10.6.4` and `10.6.5` were too new.

**Root devDependencies (exact pins)**

- `@playwright/test`: visual regression runner. Same exact version as `playwright`.
- `eslint-plugin-storybook`: story linting.
- `@vitest/browser`: only if pnpm reports it as a missing peer of `@storybook/addon-vitest`. Same exact version as `vitest`.

**`apps/storybook` devDependencies (exact)**

- `storybook`, `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`
- `react`, `react-dom`, `@types/react`, `@types/react-dom`: the same versions as the rest of the repo
- `@khee/react`, `@khee/tokens`: `workspace:*`

**Container image (not an npm dependency)**

- `mcr.microsoft.com/playwright:v<playwright version>-noble@sha256:<digest>`

Anything else, including any other Storybook addon: stop and ask.

## Out of scope

- GitHub Actions, including running visual regression and `test:a11y` in CI (Phase 6)
- Publishing Storybook anywhere (GitHub Pages or similar) and filling the README's Storybook link
- Button's keyboard and ARIA docs content, and its `stable` review (Phase 5)
- Any component other than Button
- Firefox and WebKit
- Changesets: this phase changes no published code. If you find you must change `@khee/react` or `@khee/tokens`, stop and ask.
- Editing `README.md`, `CLAUDE.md`, ADRs, or handoffs. If the root README no longer matches, list it in your summary.

## Acceptance criteria

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
pnpm test:a11y
pnpm format:check
pnpm build | grep -q "FULL TURBO"

# static build exists, Button has a docs page and the expected stories
test -f apps/storybook/storybook-static/index.json
node -e "const e=Object.values(require('./apps/storybook/storybook-static/index.json').entries);const b=e.filter(x=>x.title==='Components/Button');if(!b.some(x=>x.type==='docs'))process.exit(1);for(const n of ['Primary','Secondary','Sizes','Disabled','LongLabel','Dark','Rtl','KeyboardPress'])if(!b.some(x=>x.type==='story'&&x.name.replace(/ /g,'')===n))process.exit(1);if(!b.every(x=>x.tags.includes('experimental')))process.exit(1)"

# an axe violation fails the story tests
printf 'import type { Meta, StoryObj } from "@storybook/react-vite";\nconst meta = { title: "Canary", tags: ["experimental"], render: () => <button type="button" /> } satisfies Meta;\nexport default meta;\nexport const Unnamed: StoryObj<typeof meta> = {};\n' > apps/storybook/stories/canary.stories.tsx
! pnpm --filter @khee/storybook exec vitest run
rm apps/storybook/stories/canary.stories.tsx

# visual regression passes against committed baselines
pnpm test:visual

# a one-token CSS change is caught
sed -i.bak 's/padding-inline: var(--khee-space-md);/padding-inline: var(--khee-space-lg);/' packages/react/src/button/button.css
pnpm build --filter=@khee/storybook
! pnpm --filter @khee/storybook test:visual
mv packages/react/src/button/button.css.bak packages/react/src/button/button.css
pnpm build --filter=@khee/storybook

# the Docker container is gone after the runs
test -z "$(docker ps -aq --filter ancestor=mcr.microsoft.com/playwright)"

# pnpm dev serves Storybook
(pnpm dev > /dev/null 2>&1 &) ; for i in $(seq 1 60); do curl -sf http://localhost:6006/index.json > /dev/null && break; sleep 1; done
curl -sf http://localhost:6006/index.json | grep -q 'components-button'
pkill -f "storybook dev"

# the image is pinned by digest at the root playwright version
grep -Eq "mcr.microsoft.com/playwright:v$(node -p "require('./package.json').devDependencies.playwright")-noble@sha256:[0-9a-f]{64}" apps/storybook/scripts/visual.ts

# every Storybook package shares one exact version
node -e "const j=require('./apps/storybook/package.json');const r=require('./package.json');const all={...j.devDependencies,...r.devDependencies};const v=Object.entries(all).filter(([k])=>k==='storybook'||k.startsWith('@storybook/')||k==='eslint-plugin-storybook').map(([,v])=>v);if(v.length<6||new Set(v).size!==1||!/^\d+\.\d+\.\d+$/.test(v[0]))process.exit(1)"

# the tree is clean and nothing ignored got committed
git diff --exit-code && test -z "$(git status --porcelain)"
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo|\.next|storybook-static|test-results|playwright-report)/')"
```

## Stop and ask triggers (task specific)

- Storybook needs a package not on the allowed list, or `storybook` CLI commands try to install anything
- The source aliases break `storybook build`, or React Aria resolves to two copies
- `@storybook/addon-vitest` cannot run inside the existing Vitest browser setup without a second Vitest version
- Axe reports a violation in Button you cannot fix without changing `@khee/react` or `@khee/tokens`
- Any story fails the reduced-motion, zoom, or text-scaling checks because of component CSS
- The Playwright image for the root `playwright` version does not exist, or `exposeNetwork` cannot reach the host
- Screenshots differ between two consecutive runs with no code change (flakiness). Do not raise thresholds to hide it.

## Commits

Suggested sequence:

1. `build: set up storybook for react`
2. `feat: add theme and direction toolbars`
3. `test: run stories and axe checks in vitest`
4. `docs: add storybook docs page template and status badges`
5. `docs: add button stories`
6. `test: add dockerized visual regression`
7. `test: add reduced motion and zoom checks`
