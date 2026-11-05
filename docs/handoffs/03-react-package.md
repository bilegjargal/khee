# Handoff 03: React package

**Phase:** 3 of 6
**Goal:** `@khee/react` is a real, publishable package: plain `tsc` NodeNext build, CSS entry points, React Aria pinned, tests in a real browser, a `"use client"` check, and a Next.js App Router app that proves it all works.
Button is built as the pilot component that exercises every part of the pipeline.

Read `CLAUDE.md` and ADRs 0001, 0002, 0004, 0005, 0007, and 0010 first.
Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Phases 1 and 2 are complete.
- `@khee/tokens` ships `tokens.css` with palette and semantic tiers, light and dark themes.
- Root Stylelint config with the local plugin at `packages/tokens/stylelint/plugin.js` (`khee/no-unknown-token`, `khee/no-palette-outside-tokens`).
- `@khee/react` is a placeholder: `src/index.ts` exports a constant.

## Decisions already made

These were settled by the owner for this phase. Do not reopen them in your plan.

- **Button is the pilot component.** It ships here with its code, CSS, and tests, marked `experimental`.
  Stories come in Phase 4. Visual regression, the docs section, and the `stable` review come in Phase 5.
- **Tests run in Vitest browser mode** with the Playwright provider, in headless Chromium.
  Focus, keyboard, and layout behave as they do for users. jsdom is not used.
- **No JSX accessibility lint plugin.** `eslint-plugin-jsx-a11y` does not support ESLint 10, and the fork is a supply-chain risk.
  React Aria supplies the ARIA patterns, and axe checks every story from Phase 4 onward.
- **React 19 only.** `react` and `react-dom` peer ranges are `^19.0.0`. Refs are a regular `ref` prop, so no `forwardRef`.
- **No component-local custom properties.** ADR 0003 has no component tier, so component CSS never declares `--*` properties and `khee/no-unknown-token` stays strict.

## In scope

### 1. Package setup (`packages/react`)

- `package.json`:
  - `dependencies`: `react-aria-components`, exact version (ADR 0010). Nothing else.
  - `peerDependencies`: `react` and `react-dom` at `^19.0.0`.
  - `exports`:
    - `"."` with `types` and `default` pointing into `dist/`
    - `"./components.css": "./dist/components.css"`
    - `"./reset.css": "./dist/reset.css"`
  - `"sideEffects": ["**/*.css"]`.
  - `"files"`: `dist` and `src`, excluding tests, so the published source maps and declaration maps resolve.
  - No `install`, `preinstall`, `postinstall`, or `prepare` scripts.
- TypeScript, three configs:
  - `tsconfig.json`: everything under `src/` including tests, `module`/`moduleResolution` `NodeNext`, `jsx: "react-jsx"`, `lib` with `DOM` and `DOM.Iterable`, no Node types.
  - `tsconfig.build.json`: extends it, excludes tests, emits to `dist/` with declarations and maps.
  - `scripts/tsconfig.json`: the Node scripts, with `types: ["node"]`, `noEmit`, `allowImportingTsExtensions`, and `erasableSyntaxOnly`, so ESLint's project service finds the nearest config for every file.
- Relative imports use explicit `.js` extensions. The compiler enforces this.
- `scripts/build.ts` (run by Node's native type stripping): clears `dist/`, runs `tsc -p tsconfig.build.json`, then copies every `src/**/*.css` file to the same path under `dist/`, byte for byte.
- Package scripts: `build`, `lint` (ESLint and Stylelint), `typecheck`, `test`, and `check:use-client`.

### 2. CSS entry points

- `src/reset.css`: a small modern reset inside `@layer khee.reset { ... }` (box sizing, margins, form controls inheriting fonts, media elements as blocks).
  It is optional and documented as skippable with Tailwind Preflight.
- `src/components.css`: only `@import` statements for each component's CSS file, using relative paths.
- Each component CSS file wraps all of its rules in `@layer khee.components { ... }` itself, so it is correct even when imported directly.

### 3. Stylelint additions

Add to the local plugin and the root config. No new dependencies.

- New plugin rule `khee/require-layer`: every rule and declaration must sit inside an `@layer` block whose name starts with `khee.`.
  `@import` and `@layer` statements are allowed at the top level.
  It applies to all Khee CSS, including `tokens.css`.
- An `overrides` entry for `packages/react/**/*.css` that bans hardcoded design values:
  - `color-no-hex` and `color-named: "never"`
  - `function-disallowed-list` for `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, and `color`
  - `unit-disallowed-list` for `px`, `rem`, `em`, `ms`, and `s`, ignoring media feature values
  - `property-disallowed-list` extended with `/^--/`, so component CSS cannot declare custom properties
- CSS system colors (`ButtonText`, `ButtonFace`, `Highlight`, `GrayText`, `CanvasText`, ...) stay allowed for `forced-colors` styles.
  Confirm `color-named` does not flag them; if it does, stop and ask.

### 4. Shared helper

- `src/utils/compose-class-name.ts`: prepends the component's `khee-*` class to the consumer's `className`, supporting both the string and the render-function form, built on React Aria's `composeRenderProps`.
- Khee components never set inline styles, so `style` is passed through untouched in both forms. Do not add a style-merging helper.
- Unit tests for both forms, including `undefined`.

### 5. Button (pilot)

- `src/button/button.tsx`, starting with `"use client"`, wrapping React Aria's `Button`.
- `ButtonProps` extends React Aria's `ButtonProps` and adds:
  - `variant?: "primary" | "secondary"`, default `"primary"`
  - `size?: "sm" | "md"`, default `"md"`
  - `ref?: React.Ref<HTMLButtonElement>`
- Renders `className="khee-button"` merged with the consumer's, plus `data-variant` and `data-size`.
  All other props pass through.
- `src/button/button.css`:
  - Uses only semantic tokens.
  - Styles React Aria state attributes: `[data-hovered]`, `[data-pressed]`, `[data-focus-visible]`, `[data-disabled]`. No `:hover` or `:focus-visible` pseudo-classes.
  - Primary: `primary` background, `primary-hover` when hovered or pressed, `on-primary` text.
  - Secondary: `surface` background, `text` color, `border` outline.
  - Disabled: `surface` background, `text-muted` color, `border` outline. No opacity tricks.
  - Focus ring uses `--khee-color-focus-ring` and `--khee-focus-ring-width`, drawn outside the button.
  - Sizes map to `--khee-space-*` padding and `--khee-font-size-*`.
  - Transitions use `--khee-duration`, which is already `0ms` under reduced motion.
  - Logical properties only. No fixed widths, so translated labels fit.
  - A `@media (forced-colors: active)` block using system colors, with a visible focus indicator and a distinct disabled state.
- `src/index.ts` exports `Button` and `ButtonProps`, and re-exports `PressEvent`, `Key`, and `Selection` as types from `react-aria-components`.

### 6. Tests (Vitest browser mode)

- `packages/react/vitest.config.ts`: browser mode, Playwright provider, headless Chromium, tests matching `src/**/*.test.tsx` and `src/**/*.test.ts`.
- Render with `vitest-browser-react`. Drive input with Vitest's own `userEvent` from `vitest/browser`, which sends real browser events through Playwright.
- `src/button/button.test.tsx` covers at least:
  - Role `button` and the accessible name from its children
  - Default and custom `data-variant` and `data-size`
  - `className` merging in string and function form; `style` passing through in both forms
  - `ref` pointing to the `HTMLButtonElement`
  - Keyboard: Tab moves focus to it and sets `data-focus-visible`; Enter and Space each fire `onPress`
  - Pointer: click fires `onPress` and sets `data-pressed` while pressed
  - `isDisabled`: not reachable by Tab, `onPress` never fires
- Chromium is installed with `pnpm exec playwright install chromium`. This downloads a browser binary; it is not an install script in any package.

### 7. `"use client"` check

- `scripts/check-use-client.ts` parses every emitted `dist/**/*.js` file with the TypeScript compiler API (`typescript` is already a root dependency).
- A file is interactive if it imports from `react-aria-components` or imports any `use*` binding from `react`.
- Every interactive file must start with the `"use client"` directive. The script lists offenders and exits 1.
- Fixture tests with `node:test` in `scripts/check-use-client.test.ts`: a passing file, a missing directive, a directive that is not first, and a non-interactive file without the directive (allowed).
- The package `test` script runs both Vitest and `node --test`.

### 8. ESLint

- Add `eslint-plugin-react-hooks` with its recommended flat config for `**/*.tsx`.
- Browser globals for `packages/react/src/**` and `apps/next-app/**`.
- Ignore `.next/` everywhere.

### 9. Next.js app (`apps/next-app`)

- `@khee/next-app`, `"private": true`, App Router, no `src/` folder.
- Depends on `@khee/react` and `@khee/tokens` via `workspace:*`.
- `app/globals.css` imports, in order: `@khee/tokens/tokens.css`, `@khee/react/reset.css`, `@khee/react/components.css`.
- `app/layout.tsx` and `app/page.tsx` are server components with no `"use client"`.
  `page.tsx` renders `<Button>` (primary and secondary, no event handlers, since functions cannot cross the server boundary).
- `build` runs `next build` with `NEXT_TELEMETRY_DISABLED=1`. `typecheck` and `lint` scripts match the other workspaces.
- Commit a `tsconfig.json` that `next build` accepts unchanged. `next-env.d.ts` is generated and git-ignored.
- Turborepo `build` outputs include `.next/**` and exclude `.next/cache/**`.
- Add `.next/` and `next-env.d.ts` to `.gitignore`, and `.next/` to `.prettierignore`.

### 10. Package README

`packages/react/README.md`: install, peer dependencies, CSS imports and layer order, a Button example, where types come from, and a note that Button is `experimental`.
Keep it short; the root README stays the main documentation.

## Allowed dependencies

Look up every version with `npm view`, check peer ranges, and respect the 14-day rule.
Several of these had releases in the last two weeks at the time of writing, so expect to pick an older version.

**Root devDependencies (exact pins)**

- `vitest`: test runner.
- `vite`: required peer of Vitest.
- `@vitest/browser-playwright`: Vitest's Playwright browser provider.
- `playwright`: drives Chromium for browser mode, reused for visual regression in Phase 4.
- `vitest-browser-react`: renders React components in Vitest browser mode.
- `eslint-plugin-react-hooks`: rules of hooks and dependency checks.

**`@khee/react`**

- `dependencies`: `react-aria-components` (exact).
- `peerDependencies`: `react`, `react-dom` (`^19.0.0`).
- `devDependencies` (exact): `react`, `react-dom`, `@types/react`, `@types/react-dom`.

**`apps/next-app`**

- `dependencies` (exact): `next`, `react`, `react-dom`, plus `@khee/react` and `@khee/tokens` as `workspace:*`.
- `devDependencies` (exact): `@types/react`, `@types/react-dom`.

Use the same `react`, `react-dom`, and `@types/*` versions everywhere.
If Vitest needs `@vitejs/plugin-react` or any other package to handle TSX, stop and ask.
Anything else: stop and ask.

## Out of scope

- TextField, Dialog, Select, Card, or any component other than Button (Phase 5)
- Storybook, stories, the axe addon, and visual regression (Phase 4)
- Button's keyboard and ARIA docs section and its `stable` review (Phase 5)
- Firefox and WebKit test runs
- GitHub Actions and Changesets (Phase 6). No changeset is needed yet.
- Per-component CSS entry points (for example `@khee/react/button.css`)
- Editing `README.md`, `CLAUDE.md`, ADRs, or handoffs. If the root README no longer matches, list it in your summary.

## Acceptance criteria

All must exit 0 from a fresh clone, run from the repo root. Paste outputs in your summary.

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

# next build leaves the tree clean
git diff --exit-code && test -z "$(git status --porcelain)"

# "use client" check passes on real output (fixture failures are covered by pnpm test)
pnpm --filter @khee/react check:use-client
head -c 13 packages/react/dist/button/button.js | grep -q '"use client"'

# server-rendered page contains the button with its data attributes
grep -q 'khee-button' apps/next-app/.next/server/app/index.html
grep -q 'data-variant="primary"' apps/next-app/.next/server/app/index.html

# dist mirrors src: one .js and .d.ts per module, CSS copied byte for byte, no tests
for f in packages/react/src/**/*.css packages/react/src/*.css; do cmp "$f" "packages/react/dist/${f#packages/react/src/}"; done
test -z "$(find packages/react/dist -name '*.test.*')"
test -f packages/react/dist/index.d.ts && test -f packages/react/dist/button/button.d.ts

# public types are exported
grep -q 'ButtonProps' packages/react/dist/index.d.ts
for t in PressEvent Key Selection; do grep -q "$t" packages/react/dist/index.d.ts; done

# package.json contract
node -e "const j=require('./packages/react/package.json');const s=j.scripts??{};const d=Object.keys(j.dependencies??{});const v=j.dependencies?.['react-aria-components']??'';if(JSON.stringify(d)!=='[\"react-aria-components\"]'||!/^\d+\.\d+\.\d+$/.test(v)||j.peerDependencies?.react!=='^19.0.0'||j.peerDependencies?.['react-dom']!=='^19.0.0'||!j.exports['./components.css']||!j.exports['./reset.css']||['install','preinstall','postinstall','prepare'].some(k=>s[k]))process.exit(1)"

# tarball has no tests and includes the CSS entry points
(cd packages/react && pnpm pack --dry-run --json) | node -e "const f=JSON.parse(require('fs').readFileSync(0,'utf8')).files.map(x=>x.path);if(f.some(p=>/\.test\./.test(p))||!f.includes('dist/components.css')||!f.includes('dist/reset.css'))process.exit(1)"

# stylelint guards component CSS
printf '@layer khee.components { .khee-x { color: #fff; } }\n' | pnpm exec stylelint --stdin-filename packages/react/src/x.css 2>&1 | grep -q "color-no-hex"
printf '@layer khee.components { .khee-x { padding: 4px; } }\n' | pnpm exec stylelint --stdin-filename packages/react/src/x.css 2>&1 | grep -q "unit-disallowed-list"
printf '@layer khee.components { .khee-x { --khee-x: 0; } }\n' | pnpm exec stylelint --stdin-filename packages/react/src/x.css 2>&1 | grep -q "property-disallowed-list"
printf '.khee-x { color: var(--khee-color-text); }\n' | pnpm exec stylelint --stdin-filename packages/react/src/x.css 2>&1 | grep -q "khee/require-layer"
printf '@layer khee.components { .khee-x { color: var(--khee-color-text); } }\n' | pnpm exec stylelint --stdin-filename packages/react/src/x.css

# nothing ignored got committed
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo|\.next)/')"
```

The CSS loop needs `shopt -s globstar` in bash, or run it in zsh.

## Stop and ask triggers (task specific)

- React Aria's `Button` does not pass `data-variant` or `data-size` through to the DOM
- `color-named` flags CSS system colors
- Vitest browser mode needs another package to handle TSX
- `next build` rewrites a tracked file and cannot be stopped through config
- Turbopack cannot resolve the relative `@import` chain in `components.css`
- The `"use client"` directive is not preserved as the first statement in `tsc` output
- Any semantic token needed by Button is missing

## Commits

Suggested sequence:

1. `build: set up react package with nodenext tsc build`
2. `build: add stylelint layer and hardcoded value rules`
3. `test: set up vitest browser mode`
4. `feat: add button as pilot component`
5. `test: add use client check`
6. `test: add next.js app router compatibility app`
7. `docs: add react package readme`
