# 0002. `khee` prefix and cascade layers for collision-free styling

- Status: Accepted
- Date: 2026-11-01

## Context

Library CSS shares a global namespace with every consuming app.
Two kinds of collision matter:

- **Name collisions:** a generic `.button` class or `--primary` variable clashes with app code.
- **Specificity fights:** apps should be able to override library styles without `!important` or selector games.

Tailwind v4 also uses cascade layers (`theme`, `base`, `components`, `utilities`).
A library layer declared before Tailwind's would lose to Preflight in `base`, which resets things like button backgrounds.

## Decision

- Every class is prefixed: `.khee-<component>`. Every custom property is prefixed: `--khee-*`.
- All library CSS lives in the `khee` cascade layer, split into sub-layers `khee.reset`, `khee.tokens`, and `khee.components`.
- Apps using Tailwind declare the layer order before any import, placing `khee` after `base`:

  ```css
  @layer theme, base, khee, components, utilities;
  ```

- Apps that use Tailwind Preflight skip `reset.css`.

## Consequences

- Unlayered app CSS always wins over library CSS, regardless of specificity or import order.
- Theme overrides are plain, unlayered custom property declarations.
- Tailwind users must add one line of layer ordering. The README documents it.
- Class names are slightly longer. That is the price of never colliding.
