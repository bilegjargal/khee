# Architecture decision records

This folder records the significant decisions behind Khee and why they were made.
Each record is short, numbered, and immutable once accepted.
When a decision changes, a new record supersedes the old one, and the old one is marked `Superseded by NNNN`.

| ADR                                                     | Decision                                                    | Status   |
| ------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| [0001](./0001-plain-css.md)                             | Plain CSS over Tailwind, Sass, and CSS-in-JS                | Accepted |
| [0002](./0002-prefix-and-cascade-layers.md)             | `khee` prefix and cascade layers for collision-free styling | Accepted |
| [0003](./0003-two-tier-tokens.md)                       | Two-tier tokens in one hand-written `tokens.css`            | Accepted |
| [0004](./0004-react-aria-components.md)                 | React Aria Components as the primitive layer                | Accepted |
| [0005](./0005-pass-through-react-aria-props.md)         | Pass React Aria props through                               | Accepted |
| [0006](./0006-two-packages-fixed-release.md)            | Two packages released as a fixed group                      | Accepted |
| [0007](./0007-plain-tsc-build.md)                       | Plain `tsc` build with NodeNext resolution                  | Accepted |
| [0008](./0008-release-and-supply-chain.md)              | Trusted publishing and supply-chain hardening               | Accepted |
| [0009](./0009-secured-ai-bug-fix-workflow.md)           | A secured, label-gated AI bug-fix workflow                  | Accepted |
| [0010](./0010-exact-pin-react-aria-components.md) | Exact pin for `react-aria-components` | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

What problem or force makes this decision necessary.

## Decision

What we do, stated as rules.

## Consequences

What gets easier, what gets harder, and what we must watch.
```
