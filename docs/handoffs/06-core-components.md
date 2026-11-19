# Handoff 06: Core components

**Phase:** 6 of 6
**Goal:** `@khee/react` ships the core five components (Button, TextField, Dialog, Select, Card) with stories, keyboard and axe tests, visual baselines, and docs content, and the semantic token set is reviewed against them.
This completes the README's v0.2 "Core components" milestone.

Read `CLAUDE.md`, handoffs 03 and 04, and ADRs 0002, 0003, 0004, 0005, 0010, and 0011 first.
Deliver a written plan and wait for confirmation before writing any files.

## Starting state

- Phases 1 to 5 are complete. `@khee/tokens` and `@khee/react` `0.1.0` are published to npm with provenance.
- Every PR runs the CI from handoff 05: `checks`, `changeset`, and `visual` (Dockerized Playwright, only when CSS, components, or stories change).
- `@khee/react` ships one component, Button (`experimental`), pinned on `react-aria-components` `1.22.1`.
  `components.css` imports `button/button.css`.
- Storybook has a docs page template whose Keyboard and ARIA sections are fed by `parameters.kheeDocs`.
  Button's meta sets `kheeDocs: {}`, so both sections show "Not documented yet".
- Visual regression and the media checks (`apps/storybook/visual/`) screenshot and inspect `#storybook-root` only.
  Content that React Aria portals to `document.body` (modals, popovers) is not covered yet.
- The semantic tier has 29 tokens. There is no hover token for `danger`, no divider token, and no size token for containers.
- ADR 0011 (non-interactive components) is accepted: Card is a plain element rendered as a server component.
- `src/utils/compose-class-name.ts` starts with `"use client"`, so a server component cannot call it.
- Follow-ups recorded in `TASKS.md` for this phase:
  - Button's keyboard and ARIA docs content
  - Revisit secondary Button hover and pressed (currently `background` fill and `text` border)
  - Drop "Status: experimental." from Button's JSDoc, since the docs badge already says it
  - Consider a softer divider token, since `--khee-color-border` must reach 3:1 and is a mid gray

## Decisions already made

These were settled by the owner for this phase. Do not reopen them in your plan.

- **One handoff for the whole phase, delivered as six sequential PRs** (see "Delivery"). Each PR is its own session: stop after opening it.
- **Every component stays `experimental`.** The README's v1.0 milestone marks components `stable` only after manual screen reader passes, which this phase does not include.
- **No `danger` Button variant in this phase.** Button's API stays `primary | secondary` and `sm | md`. Destructive Dialog stories use the primary Button.
- **Light `surface` stays `gray-50`** (#fcfcfd) on a `gray-100` page. Revisit it in the token review with Card screenshots, and record the outcome.
- **Card is a non-interactive component (ADR 0011).** A plain `<div>`, no React Aria, no `"use client"`, and nothing imported from a client module, so it renders as a server component.
- **One new semantic token, `--khee-color-border-subtle`,** added in the Card PR for decorative outlines and separators that do not need 3:1 contrast.
  Light theme `gray-200`, dark theme `gray-800`. Interactive control boundaries keep `--khee-color-border`.
- **Composition over prop surfaces** (`CLAUDE.md`). Compound components are exported as parts, the way React Aria exports them, not as one component with `label`, `description`, and `errorMessage` props.
- **Each Khee part wraps exactly one React Aria component**, with the same name where one exists, so ADR 0005's pass-through stays one-to-one.
  The exception is `SelectTrigger` (renders `SelectValue` and a chevron inside React Aria's `Button`), documented in its section. Card has no React Aria primitive and follows ADR 0011.
  Record this convention as **ADR 0012** in the TextField PR.
- **Field parts are shared.** `Label`, `Input`, `FieldDescription`, and `FieldError` are separate components used by TextField and Select, and later by every form control.
- **Generic React Aria components stay generic.** `Select<T>`, `ListBox<T>`, and `ListBoxItem<T>` keep their type parameter, so `items` and render-prop types flow through.
- **No size prop on TextField or Select in this phase.** Adding one later is a minor change; removing one is major.
- **No new dependencies.** Icons (the Select chevron, the selected-item check) are inline SVG with `aria-hidden="true"` and `fill` or `stroke` set to `currentColor`, so forced colors work.
- **Additive token changes only.** Renaming or removing a token is a major change, and a `major` changeset at `0.x` would publish `1.0.0`.
  Every changeset in this phase is `minor` (new components, props, or tokens) or `patch`.
- **Validation follows React Aria's defaults** (`validationBehavior="native"`). Khee does not change it.

## Delivery

Six PRs, in this order.
Each one passes every acceptance command locally and every CI check on GitHub before you open it.
After opening each PR, stop and wait for the owner to merge it before starting the next.
Each PR that changes published code has its own changeset.

1. Button
2. Card
3. Field parts and TextField (with ADR 0012)
4. Dialog (with portal support in the visual suite)
5. Select, Popover, and ListBox
6. Token review

The owner merges the Changesets "Version packages" PR after PR 6, so `0.2.0` ships all five components together.

## Shared requirements for every component

- Folder per component under `packages/react/src/<kebab-name>/` with `<name>.tsx`, `<name>.css`, and `<name>.test.tsx`.
  Every exported part gets its own folder, including parts used inside one compound component (for example `list-box-item/`), per `CLAUDE.md`'s "one component per folder" rule.
- Interactive files start with `"use client"`. Card does not, and `check:use-client` must still pass.
- Props types extend the wrapped React Aria props, add only Khee props, and are exported from `index.ts` (`TextFieldProps`, `DialogProps`, ...).
- `className` is merged with `composeClassName`, including the render-function form. `style` passes through.
  Non-interactive components (Card) use `join-class-names` instead, since `composeClassName` is a client module (ADR 0011).
- `ref` reaches the underlying DOM element, with a test.
- CSS lives in `@layer khee.components`, uses `.khee-<name>` classes and React Aria's `data-*` state attributes, logical properties, and semantic tokens only.
  Each file is imported from `components.css`.
- Every component works in forced colors (system colors for borders, text, focus, selection, and disabled), at 200% zoom, at 320 CSS pixels wide, and with text at 200%.
- Animations use `--khee-duration`, which is already `0ms` under `prefers-reduced-motion`.
- Stories in `apps/storybook/stories/<name>.stories.tsx`: every variant and state, `LongLabel` (German or similar), `Dark`, `Rtl` (Arabic or Hebrew text), and a keyboard `play` story. Interactive components get the `interactive` tag.
- `kheeDocs` content: a Keyboard table and ARIA notes, written from the component's actual behavior and checked against the WAI-ARIA APG pattern it implements.
  No component may show "Not documented yet" at the end of this phase.
- Unit and keyboard interaction tests in Vitest browser mode, including the WCAG 2.2 target size check (24 by 24 CSS pixels) for every interactive target.
- `apps/next-app` renders the component from its server component page, without event handlers.
- The `@khee/react` README gets a short usage section and props table per component, in Button's existing format.
- The `check:pack` NodeNext fixture imports every new export.
- Visual baselines are regenerated with `pnpm --filter @khee/storybook test:visual --update-snapshots` (locally in the pinned image, or from the `visual-baselines` workflow artifact) and committed.
  Existing baselines must not change unless the PR intends it; list every changed baseline in the PR description.

## In scope

### 1. Button

- Fill `kheeDocs`: Tab, Enter, Space, and the disabled behavior; ARIA notes on the `button` role, accessible name from children, and `isDisabled` (removed from the tab order, `disabled` attribute set).
- Secondary hover and pressed: propose a revised treatment in your plan, with before and after screenshots of light and dark themes.
  It must keep 3:1 non-text contrast for the border and 4.5:1 for the label in every state.
- Remove "Status: experimental." from the JSDoc.
- Out of this PR: `isPending` styling (needs a Spinner, v0.4).

### 2. Card (`packages/react/src/card/`)

- Add `--khee-color-border-subtle` to `tokens.css` (light and `[data-theme="dark"]`), with a comment that it is decorative and not a contrast pair, and to the `@khee/tokens` README table.
- `Card` renders a `<div>` with `.khee-card`: `surface` background, a `border-subtle` outline at `--khee-border-width`, `radius-md`, `space-lg` padding, a `space-md` gap between children, and `shadow-sm`.
  In forced colors the outline uses `CanvasText`, since shadows disappear.
- `CardProps` is `ComponentPropsWithRef<"div">`. No variants and no sub-parts in this phase. Headings and content are the app's own markup.
- `className` is appended with a new `src/utils/join-class-names.ts`: no `"use client"`, no `react-aria-components` import, unit-tested with and without a consumer class. `composeClassName` may call it.
- Not interactive: no `"use client"`, no `interactive` tag, an explicit empty `keyboard` list in `kheeDocs`.
  Update the docs template so `keyboard: []` renders "No keyboard interaction" instead of "Not documented yet".
- ARIA notes explain that Card has no role, and that apps add `role="region"` with a label, or use `<article>` or `<section>` content, when the card is a landmark.
- Stories include a card containing a Button and long text, to show it grows with content and never sets a fixed width.

### 3. Field parts and TextField

- Parts, each in its own folder:
  - `Label` wraps `Label` (`.khee-label`)
  - `Input` wraps `Input` (`.khee-input`), with hover, focus-visible, invalid (`danger` border), and disabled states
  - `FieldDescription` wraps `Text slot="description"` (`.khee-field-description`, `text-muted`)
  - `FieldError` wraps `FieldError` (`.khee-field-error`, `danger` text)
- `TextField` wraps `TextField` (`.khee-text-field`) and lays out its children as a vertical stack.
- Tests prove the label names the input, the description and error are referenced by `aria-describedby`, `isInvalid` sets `aria-invalid` and shows the error, `isRequired` sets `required`, and native validation messages appear in `FieldError` after a form submit.
- Invalid state is never shown by color alone: the error text is always present when the field is invalid.
- Write **ADR 0012: compound components and one-to-one wrappers**. It covers the parts convention, the shared field parts, and the `SelectTrigger` exception, and refers to ADR 0011 for Card. Link it from `docs/decisions/README.md`; the root README link is for the owner to add.

### 4. Dialog

- Parts:
  - `DialogTrigger`: re-exported from its own `"use client"` file, since it renders no DOM and needs no class. Export `DialogTriggerProps` too.
  - `ModalOverlay` wraps `ModalOverlay` (`.khee-modal-overlay`, `--khee-color-overlay`, full viewport)
  - `Modal` wraps `Modal` (`.khee-modal`)
  - `Dialog` wraps `Dialog` (`.khee-dialog`)
  - `DialogTitle` wraps `Heading slot="title"` (`.khee-dialog-title`), defaulting to `level={2}`
- Stories and docs always nest them as `DialogTrigger > Button + ModalOverlay > Modal > Dialog`, and the docs page says why: `Modal` without `ModalOverlay` gets React Aria's unstyled default overlay.
- The modal is centered, scrolls internally when content is taller than the viewport, never overflows at 320 CSS pixels, and has no fixed width.
  If a maximum inline size is needed, it comes from a new semantic token, justified in your plan.
- Entering and exiting animations use `data-entering` and `data-exiting` with `--khee-duration`.
- Include a destructive confirmation story (with the primary Button, since there is no danger variant) and an `alertdialog` story (`role="alertdialog"`).
- Keyboard tests: the trigger opens the dialog with Enter and Space, focus moves inside, Tab and Shift + Tab stay inside, Escape closes it, and focus returns to the trigger. `isDismissable` closes on an outside click; `isKeyboardDismissDisabled` ignores Escape.
- **Portal support in the visual suite.** Stories whose content is portaled get an `overlay` tag:
  - `visual/stories.ts` screenshots the viewport (`page.screenshot`) for `overlay` stories instead of `#storybook-root`
  - The reduced-motion and text-scaling checks in `visual/media.spec.ts` inspect `body` descendants, not only `#storybook-root`
  - Existing Button baselines must not change
  - Confirm that the Storybook a11y addon checks portaled content. If its default context excludes it, set the context globally so it covers `body`.
- Open stories render with `defaultOpen` on `DialogTrigger` (or `isOpen` on `ModalOverlay`), so axe and screenshots see the open state without a `play` function.

### 5. Select, Popover, and ListBox

- Parts:
  - `Select<T>` wraps `Select` (`.khee-select`)
  - `SelectTrigger` renders React Aria's `Button` with `SelectValue` and a chevron icon inside (`.khee-select-trigger`). It is the documented exception to one-to-one wrapping, because every Select needs exactly this.
    Its styles match `Input`, not Button.
  - `SelectValue` is not exported in this phase, since `SelectTrigger` renders it. Exporting it later is a minor change.
  - `Popover` wraps `Popover` (`.khee-popover`, `surface`, `border`, `shadow-lg`). It is general purpose and reused by v0.4 overlays.
  - `ListBox<T>` wraps `ListBox` (`.khee-list-box`)
  - `ListBoxItem<T>` wraps `ListBoxItem` (`.khee-list-box-item`), with focused, selected, and disabled states.
    Selection is shown by a check icon, not by color alone.
- Select reuses `Label`, `FieldDescription`, and `FieldError`.
- The popover matches the trigger's width at minimum, grows with long labels, flips placement near the viewport edge, and mirrors in RTL.
- Keyboard tests: Enter, Space, and Arrow Down open the list; arrows move; Home and End jump; typeahead selects; Enter selects and closes; Escape closes without changing the value; focus returns to the trigger. Disabled items are skipped.
- Stories include a controlled selection, a disabled item, an invalid state with `FieldError`, a long list that scrolls, and an open `overlay` story (`defaultOpen`).
- `Key` is already re-exported. Re-export nothing else unless a story or test needs it, and say why.

### 6. Token review

- Review every semantic token against the five components. In your plan, list for each token: which components use it, and whether it should stay.
- Add tokens only for a demonstrated need from this phase, each with a one-line justification. Likely candidate: a container size (Dialog). Check whether `--khee-color-border-subtle` from the Card PR also fits Dialog and ListBox separators.
- Do not rename or remove any token (see "Additive token changes only"). If one looks wrong, list it as a proposal for a later major release.
- Add a contrast pair for every new foreground/background combination, in both themes.
- Update the `@khee/tokens` README for any new token.
- Revisit the light `surface` decision with Card screenshots, and record the outcome.

## Allowed dependencies

None.
Everything in this phase uses `react-aria-components` `1.22.1` (do not bump it), React, and the existing tooling.
If anything else seems necessary, stop and ask.

## Out of scope

- Marking any component `stable`, and manual screen reader passes (v1.0)
- Components from v0.3 or v0.4, including Spinner and `isPending` styling, Tooltip, Menu, and ComboBox
- Size props on TextField or Select, and Card variants or sub-parts
- A `danger` Button variant
- A required-field indicator in `Label`
- Bumping `react-aria-components`, or merging any Dependabot PR
- Publishing Storybook, or merging the "Version packages" PR
- `CONTRIBUTING.md`, the root README theming example, and other housekeeping in `TASKS.md`
- Editing `README.md`, `CLAUDE.md`, accepted ADRs, or handoffs. If the root README no longer matches (for example the v0.2 roadmap checkbox or the "Design decisions" list for ADRs 0011 and 0012), list it in your summary.

## Acceptance criteria

### Local, for every PR

All must exit 0 from a fresh clone, run from the repo root, with the Docker daemon running.
Paste outputs in each PR's description and in your final summary.

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
pnpm --filter @khee/react check:use-client
pnpm --filter @khee/tokens check:contrast
pnpm check:pack
pnpm test:visual
pnpm changeset status --since=origin/main

# no major changeset in this phase (it would publish 1.0.0)
! grep -rlE '^"@khee/(react|tokens)": major' .changeset

# the Docker container is gone after the runs
test -z "$(docker ps -aq --filter ancestor=mcr.microsoft.com/playwright)"

# the tree is clean and nothing ignored got committed
git diff --exit-code && test -z "$(git status --porcelain)"
test -z "$(git ls-files | grep -E '(^|/)(node_modules|dist|\.turbo|\.next|storybook-static|test-results|playwright-report)/')"
```

### Local, after PR 6

```bash
# every component is exported from the built package
(cd packages/react && node --input-type=module -e "const m=await import('./dist/index.js');for(const n of ['Button','Card','Label','Input','FieldDescription','FieldError','TextField','DialogTrigger','ModalOverlay','Modal','Dialog','DialogTitle','Select','SelectTrigger','Popover','ListBox','ListBoxItem'])if(!(n in m)){console.error('missing: '+n);process.exit(1)}")

# every component has a docs page, a status tag, Dark and Rtl stories
node -e "const e=Object.values(require('./apps/storybook/storybook-static/index.json').entries);for(const c of ['Button','Card','TextField','Dialog','Select']){const s=e.filter(x=>x.title==='Components/'+c);if(!s.some(x=>x.type==='docs'))process.exit(1);for(const n of ['Dark','Rtl','LongLabel'])if(!s.some(x=>x.type==='story'&&x.name.replace(/ /g,'')===n))process.exit(1);if(!s.every(x=>x.tags.includes('experimental')))process.exit(1)}"

# Card is not a client component; every interactive component is
! head -c 20 packages/react/dist/card/card.js | grep -q 'use client'
! grep -qE 'react-aria-components|compose-class-name' packages/react/dist/card/card.js
for f in button text-field dialog select list-box popover; do ls packages/react/dist/$f/*.js >/dev/null || exit 1; done

# no docs page still says "Not documented yet" (the docs content test fails otherwise)
pnpm --filter @khee/storybook exec vitest run stories/check-docs-content.test.ts

# an axe violation inside a portaled modal fails the story tests
printf 'import { Modal, ModalOverlay, Dialog } from "@khee/react";\nimport type { Meta, StoryObj } from "@storybook/react-vite";\nconst meta = { title: "Canary", tags: ["experimental", "overlay"], render: () => <ModalOverlay isOpen><Modal><Dialog aria-label="Canary"><button type="button" /></Dialog></Modal></ModalOverlay> } satisfies Meta;\nexport default meta;\nexport const Unnamed: StoryObj<typeof meta> = {};\n' > apps/storybook/stories/canary.stories.tsx
! pnpm --filter @khee/storybook exec vitest run
rm apps/storybook/stories/canary.stories.tsx

# the semantic tier only grew: every token from 0.1.0 is still defined
old=$(mktemp -d) && npm pack @khee/tokens@0.1.0 --pack-destination "$old" >/dev/null && tar -xzf "$old"/khee-tokens-0.1.0.tgz -C "$old"
for t in $(grep -oE '^\s*--khee-[a-z0-9-]+:' "$old"/package/dist/tokens.css | tr -d ' :' | sort -u); do grep -q -- "$t:" packages/tokens/tokens.css || { echo "removed: $t"; exit 1; }; done
```

Add `apps/storybook/stories/check-docs-content.test.ts` in PR 1, in the Storybook Vitest project: it loads every story file's meta with `import.meta.glob` and fails if `kheeDocs.aria` is empty, or if `kheeDocs.keyboard` is missing (an explicit `[]` is allowed for non-interactive components).

### On GitHub, for every PR

```bash
# every CI job passes, including visual
gh pr checks <pr-number> --watch
```

## Stop and ask triggers (task specific)

- A React Aria behavior needed here is missing or buggy in `1.22.1` and would need a version bump or a workaround that re-implements focus, keyboard, or ARIA handling
- A wrapper cannot keep a React Aria generic (`Select<T>`, `ListBox<T>`) or its render-prop types without `any` or a cast
- `DialogTrigger` or any part fails to render from the Next.js server component
- Axe reports a violation you cannot fix without changing the public API decided here
- A component needs a token rename or removal, or more than five new semantic tokens in total
- A change to an existing story's baseline is needed in a PR that did not intend it
- Screenshots differ between two consecutive runs with no code change (flakiness), especially for animated overlays. Do not raise thresholds to hide it.

## Commits

Suggested sequence, one PR per group:

1. Button: `feat: add button keyboard and aria docs`, `fix: revise secondary button hover and pressed states`, `docs: drop status line from button jsdoc`, `test: check docs content for every component`
2. Card: `feat: add subtle border token`, `feat: add card as a server component`
3. TextField: `docs: add adr 0012 for compound components`, `feat: add field label, input, description, and error`, `feat: add text field`
4. Dialog: `test: cover portaled stories in visual regression`, `feat: add dialog and modal`
5. Select: `feat: add popover and list box`, `feat: add select`
6. Tokens: `feat: review semantic tokens against core components`
