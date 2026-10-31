# Khee
> **Khee (хээ)**
Accessible, themeable React design system. Token-driven, accessibility-first, built on React Aria, with a Storybook playground.

[Storybook](#) · [npm](#) · [Changelog](./CHANGELOG.md)

> **Status:** Early development. APIs may change before `1.0`. Components are marked `experimental` or `stable` in Storybook.

---

## Why Khee

Copy-paste component kits are fast to start with, but styles drift across an app and across projects. Khee takes a different approach:

- **One source of truth.** Every component reads from design tokens. No hardcoded colors, spacing, or radii.
- **Brandable per project.** Each project ships a small theme file. Same components, different look.
- **Accessibility is part of the definition of done.** Keyboard support, screen reader behavior, focus management, and contrast are tested, not assumed.
- **Stable public API.** Internals (React Aria, Tailwind) are wrapped, so they can change without breaking consumers.
- **Small surface.** Primitives and a few composites. Project-specific UI stays in the project.

## Packages

| Package | Description |
| --- | --- |
| [`@khee/tokens`](./packages/tokens) | Framework-agnostic design tokens (W3C Design Tokens JSON), compiled to CSS variables, Tailwind theme, and TypeScript types |
| [`@khee/react`](./packages/react) | Accessible React components built on the tokens |

## Installation

```bash
pnpm add @khee/react @khee/tokens
```

Import the base styles once at your app root:

```tsx
import "@khee/tokens/css";
import "@khee/react/styles.css";
```

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

## Theming

Tokens are organized in three tiers:

| Tier | Example | Who changes it |
| --- | --- | --- |
| Primitive | `color.blue.500` | Brand themes |
| Semantic | `color.bg.primary`, `color.text.danger` | Brand themes |
| Component | `button.bg.primary` | Rarely; maps to semantic tokens |

Components only consume semantic and component tokens. To brand a project, override primitives and semantics:

```css
/* my-app/theme.css */
[data-theme="my-brand"] {
  --khee-color-bg-primary: #0f5132;
  --khee-color-text-on-primary: #ffffff;
  --khee-radius-md: 10px;
}
```

```html
<html data-theme="my-brand">
```

Light and dark modes are handled the same way, through semantic token overrides.

## Accessibility

Khee targets **WCAG 2.2 Level AA** and follows the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) patterns.

Each component is checked for:

- Full keyboard operation with visible focus
- Correct roles, names, and states for assistive technology
- Color contrast, validated at the token level so failing combinations cannot ship
- `prefers-reduced-motion` support
- Usable at 200% zoom and with forced colors / high contrast mode

Every component's Storybook page documents its keyboard interactions and ARIA notes.

**How it's tested:** automated axe checks in Storybook and CI, keyboard interaction tests with Playwright, plus manual screen reader passes (VoiceOver, NVDA) before a component is marked `stable`.

Found an accessibility issue? Please [open an issue](../../issues). These are treated as bugs, not enhancements.

## Development

Requirements: Node.js 26+, pnpm 9+

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
│   └── storybook/        # component playground and docs
├── packages/
│   ├── tokens/           # design tokens and build pipeline
│   └── react/            # React components
└── .changeset/           # release notes
```

### Tech stack

TypeScript · React · React Aria Components · Tailwind CSS · Style Dictionary · Storybook · Vitest · Playwright · Changesets · pnpm + Turborepo

## Roadmap

**v0.1: Foundations**
- [ ] Token pipeline (primitive, semantic, component tiers)
- [ ] Light and dark themes
- [ ] Storybook with theme switcher and a11y addon
- [ ] CI: lint, test, a11y checks, publish

**v0.2: Core components**
- [ ] Button, IconButton, Link
- [ ] TextField, TextArea, Checkbox, Radio, Switch
- [ ] Select, Combobox

**v0.3: Overlays and feedback**
- [ ] Dialog, Popover, Tooltip, Menu
- [ ] Toast, Alert, Badge, Spinner

**v1.0: Stable**
- [ ] Visual regression testing
- [ ] Documented migration and deprecation policy

## Versioning

Khee follows [Semantic Versioning](https://semver.org/). Breaking changes are announced with a deprecation warning at least one major version before removal. See the [Changelog](./CHANGELOG.md).

## Contributing

Issues and suggestions are welcome. For larger changes, please open an issue first to discuss the approach.

## License

[MIT](./LICENSE) © Bek Jargalsaikhan