# 0011. Non-interactive components without React Aria

- Status: Accepted
- Date: 2026-11-19

## Context

ADR 0004 makes React Aria Components the primitive layer, and `CLAUDE.md` describes every component as a React Aria primitive plus `khee` classes and data attributes.
That fits interactive components, where React Aria supplies focus management, keyboard behavior, and ARIA patterns.

Some components have no behavior at all.
Card, the first of them, is a styled container: it is not focusable, has no keyboard interaction, and has no ARIA pattern.
React Aria has no Card primitive, and wrapping a generic React Aria element would add a client boundary for nothing.

The `"use client"` rule matters here too.
A file that starts with `"use client"` becomes a client reference when a server component imports it, so the server cannot call its functions or render it without sending JavaScript.
A container that never needs JavaScript should stay a server component.

## Decision

- A component with no interactive behavior is a plain element with a `khee-<component>` class, not a React Aria wrapper.
- It does not start with `"use client"`, and it imports nothing that does, so it renders as a server component.
  Shared helpers it uses live in files without the directive and without `react-aria-components` imports.
- Its props extend the element's own props (for example `ComponentProps<"div">`) and pass them through, including `ref`, `role`, and `aria-*`.
  We add only our own props, such as `variant` and `size`, as ADR 0005 does for React Aria props.
- Consumer `className` is appended after the `khee-*` class, and `style` passes through untouched.
  There is no render-function form, since there are no render props.
- Variants and states are still data attributes styled in CSS, and every other rule in `CLAUDE.md` applies: tokens only, logical properties, the `khee.components` layer, stories, axe, and visual regression.
- As soon as a component needs focus, keyboard handling, or an ARIA pattern, it is built on React Aria instead. Interactive variants (for example a clickable card) are separate components or compositions, never hand-rolled behavior.

## Consequences

- Non-interactive components ship no JavaScript to the client and work in server components without a client boundary.
- The existing `"use client"` check already allows them: it only requires the directive in files that import React Aria or React hooks.
- Two kinds of components exist, so each component's docs say which kind it is and why.
- `CLAUDE.md`'s "Components are thin wrappers" rule should mention this exception the next time it is edited.
