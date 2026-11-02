# 0001. Plain CSS over Tailwind, Sass, and CSS-in-JS

- Status: Accepted
- Date: 2026-11-01

## Context

Khee is installed into many apps with different stacks.
Some use Tailwind, some use nothing, some may use another framework.
Whatever styling approach the library picks, every consuming app pays for it.

- **Tailwind inside the library** forces apps to scan our `node_modules` sources or ship a prebuilt utility sheet that can clash with their own Tailwind version and config.
- **CSS-in-JS** adds runtime cost, complicates React Server Components, and couples styling to a library's lifecycle.
- **Sass or vanilla-extract** add a build step for us and, in some setups, for consumers, while modern CSS now covers what they offered.

## Decision

- Library styles are plain, hand-written CSS.
- We use native CSS nesting, custom properties, and cascade layers.
- No Tailwind, Sass, CSS-in-JS, or vanilla-extract inside the packages.
- CSS files are copied to `dist/` as-is, never compiled.
- Variants and states are expressed as data attributes and styled in CSS, so styling logic stays out of JavaScript.

## Consequences

- Zero runtime styling cost and no build step for consumers beyond importing a CSS file.
- Works the same in any app, with or without Tailwind.
- We rely on native CSS nesting and cascade layers, which sets a modern browser baseline.
- We give up utility-class speed while authoring. Components are small, so the cost is low.
- Enforcing token usage needs tooling (Stylelint) instead of a framework's constraints. See [0003](./0003-two-tier-tokens.md).
