# 0005. Pass React Aria props through

- Status: Accepted
- Date: 2026-11-01

## Context

Two ways to wrap a headless library:

- **Own every prop.** Define a narrow, hand-written prop surface and translate it to the engine. This insulates apps from engine changes, but every capability has to be re-exposed by hand, docs duplicate upstream docs, and gaps appear wherever we forgot a prop.
- **Pass props through.** Extend the engine's prop types and forward them. Apps get the full, well-documented capability of the engine immediately.

React Aria's props are stable, carefully designed, and well documented.
Re-implementing them would cost a lot and add little.

## Decision

- Component props extend React Aria's props and pass them through. We add only our own props, such as `variant` and `size`.
- Refs are forwarded. Consumer `className` and `style` are merged with ours, including React Aria's render-function form.
- Each component's props type (`ButtonProps`, `SelectProps`, ...) is exported from `@khee/react`.
- `@khee/react` re-exports the React Aria types apps commonly need: `PressEvent`, `Key`, `Selection`, and `DateValue` once date pickers exist.
- Apps import types from `@khee/react`, never from `react-aria-components`. For a type we do not export, apps derive it from our props:

  ```ts
  type PressEvent = Parameters<NonNullable<ButtonProps["onPress"]>>[0];
  ```

- If we ever change engines, this decision is revisited.

## Consequences

- Full React Aria capability from day one, with upstream docs applying directly.
- A small amount of our own code per component.
- React Aria's prop surface becomes part of our public API. A `react-aria-components` upgrade that changes those props is a breaking change for Khee, so every upgrade needs a changelog review.
- Switching engines later would be a major, breaking release.
