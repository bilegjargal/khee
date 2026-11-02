# Handoff 02: Tokens

**Phase:** 2 of 6
**Goal:** `@khee/tokens` ships one hand-written `tokens.css` with palette and semantic tiers, light and dark themes, enforced by Stylelint token rules and a contrast check.
No React, no components.

Read `CLAUDE.md` and ADRs 0001, 0002, 0003, 0006, and 0008 first.
Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Phase 1 is complete: pnpm workspaces, Turborepo, TypeScript, ESLint, and Prettier run green across `@khee/tokens`, `@khee/react`, and `@khee/storybook`.
- `@khee/tokens` is a placeholder: `src/index.ts` exports a constant and the package builds JavaScript with `tsc`.
- No Stylelint, no CSS anywhere in the repo.

## In scope

### 1. Make `@khee/tokens` a CSS-only package

ADR 0006 says the package has no JavaScript runtime.

- Delete `packages/tokens/src/`.
- `package.json`:
  - `"exports": { "./tokens.css": "./dist/tokens.css" }` and nothing else.
  - `"sideEffects": ["./dist/tokens.css"]`.
  - `"files": ["dist"]`.
  - No `dependencies`. No `install`, `preinstall`, `postinstall`, or `prepare` scripts.
- The source file is `packages/tokens/tokens.css`.
  `build` copies it to `dist/tokens.css` byte for byte, after clearing `dist/`, using a small Node script (`scripts/build.ts`).
  No shell `cp`, so it works on every OS.
- Scripts and tests in this package are TypeScript, run directly by Node's native type stripping (no `tsx`, no `ts-node`, no compile step).
  `packages/tokens/tsconfig.json` sets `noEmit`, `module`/`moduleResolution` `NodeNext`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `allowJs`, `checkJs`, and `types: ["node"]`, and includes `scripts/`, `test/`, and `stylelint/`.
- Package scripts: `build`, `lint` (ESLint and Stylelint), `typecheck` (`tsc`), `test` (`node --test`), and `check:contrast`.

### 2. Write `tokens.css`

- The first statement declares the sub-layer order: `@layer khee.reset, khee.tokens, khee.components;`.
- Everything else lives inside `@layer khee.tokens { ... }`.
- Only custom properties are declared, plus `color-scheme: light` on `:root` and `color-scheme: dark` on `[data-theme="dark"]`.

**Palette tier (colors only)**

- Hues: `gray`, `blue`, `red`, each with steps `50, 100, 200, ... 900, 950`.
- Names match `^--khee-[a-z]+-\d+$`, for example `--khee-blue-600`.
- Values are 6-digit hex (`#rrggbb`) only, so the contrast check stays exact and dependency-free.
- Palette values are the same in every theme. Themes only remap semantic tokens.

**Semantic tier**

Use exactly this starting set of 29 tokens.
If you think it needs to change, say so in your plan with a reason per token; do not change it silently.
Semantic names never end in a digit, which is how tooling tells the tiers apart.

| Group | Tokens |
| ----- | ------ |
| Color | `--khee-color-background`, `--khee-color-surface`, `--khee-color-text`, `--khee-color-text-muted`, `--khee-color-border`, `--khee-color-primary`, `--khee-color-primary-hover`, `--khee-color-on-primary`, `--khee-color-danger`, `--khee-color-on-danger`, `--khee-color-focus-ring`, `--khee-color-overlay` |
| Space | `--khee-space-xs`, `--khee-space-sm`, `--khee-space-md`, `--khee-space-lg` |
| Radius | `--khee-radius-sm`, `--khee-radius-md`, `--khee-radius-full` |
| Typography | `--khee-font-family`, `--khee-font-size-sm`, `--khee-font-size-md`, `--khee-font-size-lg`, `--khee-font-weight-medium` |
| Shadow | `--khee-shadow-sm`, `--khee-shadow-lg` |
| Motion | `--khee-duration` |
| Lines | `--khee-border-width`, `--khee-focus-ring-width` |

Rules:

- Semantic color tokens reference palette tokens with `var()`, never raw values.
  The one exception is `--khee-color-overlay`, which may use `color-mix()` over a palette token to add transparency.
- Non-color semantic tokens hold their values directly; a palette scale for them would only restate them.
- Sizes use `rem` (spacing, font sizes, radii), so 200% zoom and user font settings work.
  Border and focus ring widths may use `px`.
- `--khee-font-family` is a system font stack. No web fonts.
- `--khee-duration` is set to `0ms` under `@media (prefers-reduced-motion: reduce)`.
- The light theme is the default on `:root`.
  The dark theme remaps semantic color tokens (and shadows if needed) under `[data-theme="dark"]`.
- No `prefers-color-scheme` auto-switching. Themes are opt-in via `data-theme` only.

### 3. Contrast pairs and check

- `packages/tokens/contrast-pairs.json` lists every foreground/background pair Khee guarantees, with its minimum ratio and what it is for:

  ```json
  [{ "foreground": "--khee-color-text", "background": "--khee-color-surface", "min": 4.5, "use": "body text" }]
  ```

- At minimum it covers:
  - `text` and `text-muted` on `background` and on `surface`: 4.5
  - `on-primary` on `primary` and on `primary-hover`: 4.5
  - `on-danger` on `danger`: 4.5
  - `danger` on `background` and on `surface` (error text): 4.5
  - `primary` on `background` and on `surface` (links): 4.5
  - `border` on `background` and on `surface` (input boundaries, WCAG 1.4.11): 3
  - `focus-ring` on `background` and on `surface` (WCAG 1.4.11): 3
- `scripts/check-contrast.ts`:
  - Takes an optional path to a CSS file, defaulting to `tokens.css`, and parses it with PostCSS.
  - Finds every theme automatically: the default (`:root`) plus every `[data-theme="..."]` block. A new theme is covered without editing the script.
  - Per theme, resolves each token: theme override first, then `:root`, following `var()` chains down to a hex value.
  - Fails if a pair token cannot be resolved to an opaque 6-digit hex value.
  - Computes the WCAG 2.x contrast ratio, prints a table (theme, pair, ratio, minimum, pass/fail), and exits 1 if any pair fails.
- The contrast math lives in its own module with unit tests against known values (for example, black on white is 21:1).

### 4. Stylelint

- Root devDependency `stylelint` and a root `stylelint.config.js`, so Phase 3's `components.css` is covered by the same config.
- Built-in rules only, plus a local plugin. No shared configs (`stylelint-config-standard` and similar).
  - `custom-property-pattern` and `selector-class-pattern`: everything starts with `khee-`.
  - `property-disallowed-list`: physical inline-axis properties (`left`, `right`, `margin-left`, `margin-right`, `padding-left`, `padding-right`, `border-left*`, `border-right*`, and the physical corner radii).
  - `declaration-property-value-disallowed-list`: `left` and `right` values for `float`, `clear`, and `text-align`.
  - `ignoreFiles`: `**/dist/**`, `**/node_modules/**`, `**/test/fixtures/**`.
- Local plugin at `packages/tokens/stylelint/plugin.js` (plain JavaScript with `// @ts-check`, typechecked by the package `tsconfig.json`; not published), with two rules:
  - `khee/no-unknown-token`: flags any `var(--khee-*)` whose name is not declared in `packages/tokens/tokens.css`.
    It reads that file relative to the plugin, not the working directory.
  - `khee/no-palette-outside-tokens`: flags any reference to a palette token (`^--khee-[a-z]+-\d+$`) in any file other than `tokens.css`.
- Plugin tests use Stylelint's Node API (`stylelint.lint({ code, config })`) with passing and failing cases for each rule.

### 5. Package README

`packages/tokens/README.md`: install, the import line, the two tiers, the semantic token table, theming by override, `data-theme`, and a link to `contrast-pairs.json` for the guaranteed pairs.
Keep it short; the root README stays the main documentation.

## Allowed dependencies (root devDependencies only, exact pins)

- `stylelint`: CSS linting and the token rules.
- `postcss`: parsing `tokens.css` in the contrast check. Already in the tree through Stylelint; declare it because we import it directly.
- `@types/node`: types for the Node scripts. Use the major that matches `.nvmrc`.

Look up versions with `npm view` and respect the 14-day rule.
Anything else: stop and ask.

## Out of scope

- `@khee/react`, `components.css`, `reset.css`, or any component (Phases 3 and 5)
- Stylelint rules for hardcoded values or cascade layers in component CSS (Phase 3)
- Forced-colors handling, which belongs in component CSS (Phases 3 and 5)
- Storybook, including token docs pages (Phase 4)
- GitHub Actions and Changesets (Phase 6). No changeset is needed yet.
- Brand themes beyond light and dark, and a Tailwind mapping file
- Editing `README.md`, `CLAUDE.md`, ADRs, or handoffs. If the root README's Theming section no longer matches, list it in your summary.

## Acceptance criteria

All must exit 0 from a fresh clone, run from the repo root. Paste outputs in your summary.

```bash
# clean install
rm -rf node_modules && pnpm install --frozen-lockfile

# pipeline
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
pnpm build | grep -q "FULL TURBO"

# contrast passes for every theme
pnpm --filter @khee/tokens check:contrast

# contrast check fails on a known-bad fixture
! node packages/tokens/scripts/check-contrast.ts packages/tokens/test/fixtures/low-contrast.css

# dist is a byte-for-byte copy
cmp packages/tokens/tokens.css packages/tokens/dist/tokens.css

# tarball contains exactly these files
(cd packages/tokens && pnpm pack --dry-run --json) | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8'));const f=j.files.map(x=>x.path).sort();if(JSON.stringify(f)!==JSON.stringify(['LICENSE','README.md','dist/tokens.css','package.json']))process.exit(1)"

# package.json contract
node -e "const j=require('./packages/tokens/package.json');const s=j.scripts??{};if(JSON.stringify(j.exports)!==JSON.stringify({'./tokens.css':'./dist/tokens.css'})||JSON.stringify(j.sideEffects)!==JSON.stringify(['./dist/tokens.css'])||j.dependencies||['install','preinstall','postinstall','prepare'].some(k=>s[k]))process.exit(1)"

# semantic set stays between 20 and 30 names
node -e "const c=require('fs').readFileSync('packages/tokens/tokens.css','utf8');const n=new Set([...c.matchAll(/(--khee-[a-z0-9-]+)\s*:/g)].map(m=>m[1]).filter(x=>!/-\d+$/.test(x)));if(n.size<20||n.size>30)process.exit(1)"

# stylelint accepts a valid reference
printf '.khee-x { color: var(--khee-color-text); }\n' | pnpm exec stylelint --stdin-filename x.css

# stylelint flags an unknown token, a palette reference, and a physical property
printf '.khee-x { color: var(--khee-color-nope); }\n' | pnpm exec stylelint --stdin-filename x.css 2>&1 | grep -q "khee/no-unknown-token"
printf '.khee-x { color: var(--khee-blue-600); }\n' | pnpm exec stylelint --stdin-filename x.css 2>&1 | grep -q "khee/no-palette-outside-tokens"
printf '.khee-x { margin-left: 0; }\n' | pnpm exec stylelint --stdin-filename x.css 2>&1 | grep -q "property-disallowed-list"

# nothing ignored got committed
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo)/')"
```

## Stop and ask triggers (task specific)

- A required pair cannot reach its minimum in a theme without changing the semantic token list
- Stylelint cannot load the local plugin from the root config without another dependency
- Node cannot run the TypeScript scripts without extra flags or a loader
- `pnpm pack` includes or omits files in a way the `files` field cannot fix
- Turborepo caching breaks because the tokens package no longer has a `src/` folder or TypeScript output

## Commits

Suggested sequence:

1. `build: make tokens a css-only package`
2. `feat: add palette and semantic tokens with light and dark themes`
3. `build: add stylelint with khee token rules`
4. `test: add contrast check for documented token pairs`
5. `docs: add tokens package readme`
