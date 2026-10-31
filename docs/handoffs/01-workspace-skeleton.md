# Handoff 01: Workspace skeleton

**Phase:** 1 of 6
**Goal:** An empty but fully wired monorepo where install, lint, typecheck, and build all run green across three placeholder workspaces. Nothing design-system specific yet.

Read `CLAUDE.md` first. Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Repo contains `README.md`, `CLAUDE.md`, `docs/handoffs/01-workspace-skeleton.md`
- No `package.json`, no dependencies

## In scope

1. **Root setup**
   - `package.json`: `"private": true`, `"type": "module"`, `packageManager` pinned to the current stable pnpm, `engines.node` matching `.nvmrc`
   - `.nvmrc`: current Node.js **Active LTS** major (verify against nodejs.org release schedule; do not assume)
   - `pnpm-workspace.yaml` covering `apps/*` and `packages/*`
   - `turbo.json` with tasks: `build`, `lint`, `typecheck`, `test`, `dev` (dev is persistent, not cached)
   - Root scripts: `build`, `dev`, `lint`, `typecheck`, `test`, `format`, `format:check`, all delegating to Turborepo except formatting
2. **TypeScript**
   - `tsconfig.base.json` at root: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`
   - Each workspace has its own `tsconfig.json` extending the base
3. **Linting and formatting**
   - ESLint flat config (`eslint.config.js`) at root with `typescript-eslint` (type-aware rules enabled)
   - Prettier with a root config and `.prettierignore`
   - No React or a11y lint plugins yet (Phase 3)
4. **Repo hygiene**
   - `.gitignore` (node_modules, dist, coverage, .turbo, storybook-static, .env*, OS files)
   - `.editorconfig`
   - `LICENSE` (MIT, copyright Bek Jargalsaikhan, current year)
5. **Placeholder workspaces**, each with `package.json`, `tsconfig.json`, and `src/index.ts` exporting a single constant so lint and typecheck have something to check:
   - `packages/tokens` → `@khee/tokens`, publishable
   - `packages/react` → `@khee/react`, publishable
   - `apps/storybook` → `@khee/storybook`, `"private": true`
   - Each defines `lint`, `typecheck`, and a `build` script (`tsc` emit to `dist/` is fine for now; it will be replaced in later phases)

## Allowed dependencies (root devDependencies only)

`turbo`, `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `globals`

Anything else: stop and ask.

## Out of scope

- Token content, Style Dictionary, or any token build (Phase 2)
- React, Tailwind, React Aria, tsup or Vite library build (Phase 3)
- Storybook installation or config (Phase 4)
- Any component (Phase 5)
- GitHub Actions, Changesets, publishing, Husky, lint-staged (Phase 6)
- Editing `README.md` or `CLAUDE.md`

## Acceptance criteria

All must exit 0 from a fresh clone. Paste outputs in your summary.

```bash
# environment matches pins
node -v | grep "^v$(cat .nvmrc)"
corepack enable && pnpm -v

# clean install, lockfile committed
rm -rf node_modules && pnpm install --frozen-lockfile

# pipeline runs across all three workspaces
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check

# turbo sees exactly these three workspaces
pnpm turbo run build --dry=json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8'));const p=[...new Set(j.tasks.map(t=>t.package))].sort();if(JSON.stringify(p)!==JSON.stringify(['@khee/react','@khee/storybook','@khee/tokens']))process.exit(1)"

# second build is fully cached
pnpm build | grep -q "FULL TURBO"

# publish settings correct
node -e "for (const p of ['tokens','react']) { const j=require('./packages/'+p+'/package.json'); if (j.publishConfig?.access!=='public') process.exit(1) }"
node -e "const j=require('./apps/storybook/package.json'); if (j.private!==true) process.exit(1)"

# nothing ignored got committed
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo)/')"
```

## Stop and ask triggers (task specific)

- Node Active LTS major is ambiguous (for example, a transition month)
- `typescript-eslint` type-aware config needs a project setup that conflicts with per-workspace tsconfigs
- Any acceptance command can't pass without changing scope

## Commits

Suggested sequence:

1. `chore: add workspace config (pnpm, turbo, node pin)`
2. `chore: add typescript base config`
3. `chore: add eslint and prettier`
4. `chore: add placeholder packages`
5. `chore: add license and editor config`