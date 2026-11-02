# 0003. Two-tier tokens in one hand-written `tokens.css`

- Status: Accepted
- Date: 2026-11-01

## Context

Tokens are the contract between the design system and every app that brands it.
A common setup uses three tiers (primitive, semantic, component), authored as W3C Design Tokens JSON and compiled with Style Dictionary into CSS, TypeScript, and Tailwind outputs.

That setup adds a build pipeline, a dependency, and a third tier whose names every theme author has to learn.
For a system of this size, the component tier mostly restates semantic tokens.

## Decision

- **Two tiers:**
  - **Palette tokens** hold raw values, for example `--khee-blue-600`. Components never reference them.
  - **Semantic tokens** are a small set of roughly 20 to 30 names, for example `--khee-color-primary`, `--khee-color-surface`, `--khee-color-border`, `--khee-radius-md`. Components use only these.
- All tokens live in one hand-written `tokens.css` in `@khee/tokens`. No token build step.
- A token is added only when there is a clear need.
- The default theme ships in `tokens.css`. Dark mode and alternate brands are scoped under `[data-theme="..."]` on the root element.
- Apps theme by overriding semantic variables in their own CSS. No build step is required to theme.
- Stylelint flags any `var(--khee-*)` reference not defined in `tokens.css`.
- A CI check validates contrast for documented foreground/background semantic pairs in every theme.

## Consequences

- Theming is one small CSS file. The semantic list is short enough to learn at a glance.
- No Style Dictionary dependency or token build to maintain.
- No generated TypeScript token types. Components reference tokens from CSS only, so this costs little.
- Without a component tier, per-component theming happens through semantic tokens or plain CSS overrides on `.khee-*` classes.
- Renaming or removing a semantic token is a breaking change (major version).
