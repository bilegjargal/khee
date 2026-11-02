# 0006. Two packages released as a fixed group

- Status: Accepted
- Date: 2026-11-01

## Context

Tokens are useful without React: in static sites, other frameworks, or plain HTML.
Components depend on a specific set of semantic token names.
Shipping them separately risks version skew, where an app pairs a component release with a tokens release it was not built against.

## Decision

- Two publishable packages:
  - `@khee/tokens`: framework-agnostic `tokens.css`, with no JavaScript runtime.
  - `@khee/react`: components, `components.css`, and an optional `reset.css`.
- Both are in a Changesets `fixed` group, so they always release together on the same version number.

## Consequences

- Non-React projects can adopt the tokens alone.
- "Same version" is the compatibility rule. Apps never have to look up a matrix.
- A tokens-only change still bumps `@khee/react`. That is cheap and keeps the rule simple.
