# Khee

> **Khee (хээ)**

Accessible, themeable React design system.
Plain CSS, token-driven, accessibility-first, built on React Aria Components, with a Storybook playground.

[Storybook](#) · [npm](#) · [Changelog](./CHANGELOG.md) · [Design decisions](./docs/decisions/)

> **Status:** Early development. APIs may change before `1.0`. Components are marked `experimental` or `stable` in Storybook.

---

## Why Khee

Copy-paste component kits are fast to start with, but styles drift across an app and across projects.
Khee takes a different approach:

- **One source of truth.** Every component reads from a small set of semantic design tokens. No hardcoded colors, spacing, or radii.
- **Brandable per project.** Each project ships a small theme file of CSS variables. Same components, different look, no build step.
- **Zero runtime styling cost.** Plain CSS files. No CSS-in-JS, no Tailwind dependency, no style collisions with your app.
- **Accessibility is part of the definition of done.** Keyboard support, screen reader behavior, focus management, and contrast are tested, not assumed.
- **Small surface.** Primitives and a few composites. Project-specific UI stays in the project.

## Packages

Both packages are always released together on the same version.

| Package                             | Description                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| [`@khee/tokens`](./packages/tokens) | Framework-agnostic design tokens as plain CSS custom properties (`tokens.css`)      |
| [`@khee/react`](./packages/react)   | Accessible React components, with `components.css` and an optional `reset.css`      |

## Installation

```bash
pnpm add @khee/react @khee/tokens
```

`react` and `react-dom` are peer dependencies.

## CSS imports

Import the styles once, in your global stylesheet:

```css
@import "@khee/tokens/tokens.css";
@import "@khee/react/reset.css"; /* optional; skip it if you use Tailwind Preflight */
@import "@khee/react/components.css";
@import "./theme.css"; /* your overrides, see Theming */
```

All Khee styles live in the `khee` cascade layer, and every class and variable is prefixed with `khee`.
Your own unlayered CSS always wins, with no specificity fights and no name collisions.

## Usage

```tsx
import { Button } from "@khee/react";

export function Example() {
  return (
    <Button variant="primary" size="md" onPress={() => console.log("saved")}>
      Save changes
    </Button>
  );
}
```

Components are built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) and accept its props (`onPress`, `isDisabled`, ...), plus Khee's own props such as `variant` and `size`.

## Types

Import all types from `@khee/react`, never from `react-aria-components`:

```ts
import type { ButtonProps, PressEvent, Key, Selection } from "@khee/react";
```

Every component exports its props type.
Commonly needed React Aria types (`PressEvent`, `Key`, `Selection`) are re-exported.
For a type Khee doesn't export, derive it from the component's props:

```ts
import type { ButtonProps } from "@khee/react";

type PressEvent = Parameters<NonNullable<ButtonProps["onPress"]>>[0];
```

## Theming

Tokens come in two tiers:

| Tier     | Example                                        | Used by                              |
| -------- | ---------------------------------------------- | ------------------------------------ |
| Palette  | `--khee-blue-600`                              | Semantic tokens only                 |
| Semantic | `--khee-color-primary`, `--khee-radius-md`     | Components, and your theme overrides |

Components only consume semantic tokens.
To brand a project, override semantic tokens in your own CSS, imported after Khee:

```css
/* my-app/theme.css */
:root {
  --khee-color-primary: #0f5132;
  --khee-color-on-primary: #ffffff;
  --khee-radius-md: 10px;
}

[data-theme="dark"] {
  --khee-color-primary: #75b798;
  --khee-color-on-primary: #0b2117;
}
```

Dark mode and alternate brands are scoped under `data-theme` on the root element:

```html
<html data-theme="dark"></html>
```

Your overrides are unlayered, so they beat every Khee theme.
Override a token for each theme you support, or it applies to all of them.

## Using with Tailwind

Tailwind v4 uses its own cascade layers.
Declare the layer order once, before any import, so Tailwind's Preflight doesn't override Khee components:

```css
@layer theme, base, khee, components, utilities;

@import "tailwindcss";
@import "@khee/tokens/tokens.css";
@import "@khee/react/components.css";
```

Skip `reset.css` when using Preflight.

To make your Tailwind utilities match Khee, map the same variables in `@theme`:

```css
@theme inline {
  --color-primary: var(--khee-color-primary);
  --color-surface: var(--khee-color-surface);
  --color-border: var(--khee-color-border);
  --radius-md: var(--khee-radius-md);
}
```

Now `bg-primary` and `rounded-md` follow your Khee theme, including dark mode.

## Next.js

Khee works with the App Router.
Interactive components ship with the `"use client"` directive, so you can render them directly from server components.

```tsx
// app/layout.tsx
import "./globals.css"; // contains the Khee CSS imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Right-to-left languages

Khee uses CSS logical properties throughout and React Aria handles RTL keyboard behavior.
Set `dir` on the root element and components mirror automatically:

```html
<html lang="ar" dir="rtl"></html>
```

## Accessibility

Khee targets **WCAG 2.2 Level AA** and follows the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) patterns.

Each component is checked for:

- Full keyboard operation with visible focus
- Correct roles, names, and states for assistive technology
- Color contrast, validated at the token level so failing combinations cannot ship
- `prefers-reduced-motion` support
- Usable at 200% zoom and in forced colors (high contrast) mode
- Correct layout and keyboard behavior in right-to-left languages

Every component's Storybook page documents its keyboard interactions and ARIA notes.

**How it's tested:** automated axe checks in Storybook and CI, keyboard interaction tests, visual regression screenshots, plus manual screen reader passes (VoiceOver, NVDA) before a component is marked `stable`.

Found an accessibility issue? Please [open an issue](../../issues).
These are treated as bugs, not enhancements.

## Design decisions

The reasoning behind Khee's architecture is recorded as [architecture decision records](./docs/decisions/):

- [Plain CSS](./docs/decisions/0001-plain-css.md) over Tailwind, Sass, and CSS-in-JS, so consumers pay no runtime or build cost.
- [A `khee` prefix and cascade layers](./docs/decisions/0002-prefix-and-cascade-layers.md), so library styles never collide with app styles.
- [Two-tier tokens](./docs/decisions/0003-two-tier-tokens.md) in one hand-written file, so theming is one small CSS file.
- [React Aria Components](./docs/decisions/0004-react-aria-components.md) as the single primitive layer, so accessibility patterns are never hand-rolled.
- [React Aria props pass through](./docs/decisions/0005-pass-through-react-aria-props.md), so apps get its full capability without importing it directly.
- [Two packages released together](./docs/decisions/0006-two-packages-fixed-release.md), so tokens work without React and versions never skew.
- [Plain `tsc` builds](./docs/decisions/0007-plain-tsc-build.md), so `"use client"` and tree-shaking survive by construction.
- [Trusted publishing and supply-chain hardening](./docs/decisions/0008-release-and-supply-chain.md), so there is no npm token to leak.
- [A secured AI bug-fix workflow](./docs/decisions/0009-secured-ai-bug-fix-workflow.md), where an agent drafts fixes and a human merge is the only path to npm.

## Development

Requirements: Node.js 26+, pnpm (version pinned in `package.json`, enable it with `corepack enable`)

```bash
pnpm install       # install dependencies
pnpm dev           # run Storybook locally
pnpm build         # build all packages
pnpm test          # unit and interaction tests
pnpm test:a11y     # accessibility checks
pnpm lint          # lint and typecheck
```

### Repository structure

```
khee/
├── apps/
│   ├── storybook/        # component playground and docs
│   └── next-app/         # Next.js App Router compatibility check
├── packages/
│   ├── tokens/           # tokens.css
│   └── react/            # React components and component CSS
├── docs/
│   └── decisions/        # architecture decision records
└── .changeset/           # release notes
```

### Tech stack

TypeScript · React · React Aria Components · Plain CSS (nesting, custom properties, cascade layers) · Storybook · Vitest · Playwright · Stylelint · Changesets · pnpm + Turborepo

## Roadmap

**v0.1: Foundations**

- [ ] `tokens.css` with palette and semantic tiers, light and dark themes
- [ ] Stylelint token checks and token-level contrast checks
- [ ] Storybook with theme switcher, LTR/RTL toggle, and a11y addon
- [ ] CI: lint, test, a11y checks, visual regression, `"use client"` check
- [ ] Release pipeline with Changesets and npm trusted publishing

**v0.2: Core components**

- [ ] Button, TextField, Dialog, Select, Card

**v0.3: Form controls**

- [ ] IconButton, Link, TextArea, Checkbox, Radio, Switch, ComboBox

**v0.4: Overlays and feedback**

- [ ] Popover, Tooltip, Menu
- [ ] Toast, Alert, Badge, Spinner

**v1.0: Stable**

- [ ] All components marked `stable` after manual screen reader passes
- [ ] Documented migration guide

## Versioning

Khee follows [Semantic Versioning](https://semver.org/).
Renaming or removing a token, prop, class, or CSS entry point is a breaking change.
Deprecated APIs log a development warning and are noted in the changelog for at least one minor version before removal in a major.
See the [Changelog](./CHANGELOG.md).

## Contributing

Issues and suggestions are welcome.
For larger changes, please open an issue first to discuss the approach.
Pull requests that change published code need a changeset (`pnpm changeset`).

## License

[MIT](./LICENSE) © Bek Jargalsaikhan
