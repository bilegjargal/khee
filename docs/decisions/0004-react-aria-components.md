# 0004. React Aria Components as the primitive layer

- Status: Accepted
- Date: 2026-11-01

## Context

Accessibility is Khee's first priority.
Focus management, keyboard navigation, roving tabindex, typeahead, and ARIA semantics are hard to get right, and hand-rolled versions are a common source of bugs.
Two mature headless options exist: Radix UI and React Aria Components.
Supporting both would mean inconsistent behavior and double the maintenance.

## Decision

- `react-aria-components` is the single primitive layer for interactive components.
- It is a regular `dependency` of `@khee/react`. `react` and `react-dom` are `peerDependencies`.
- We never hand-roll a pattern React Aria already solves.
- Components style React Aria's built-in state attributes (`data-pressed`, `data-hovered`, `data-focus-visible`, `data-disabled`, `data-invalid`, ...).

## Consequences

- Strong WAI-ARIA APG fidelity, including complex widgets like Select, ComboBox, and date pickers.
- Built-in internationalization and RTL handling match our logical-properties rule.
- State data attributes fit our data-attribute styling model with no extra JavaScript.
- React Aria's interaction model (`onPress`, `isDisabled`, ...) is part of our API. See [0005](./0005-pass-through-react-aria-props.md).
- `@khee/react` carries one significant runtime dependency, which must be kept current.
