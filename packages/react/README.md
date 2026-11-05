# @khee/react

Accessible React components for [Khee](https://github.com/bilegjargal/khee), built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) and styled with plain CSS.
Styling has no runtime cost, and interactive components are marked `"use client"`, so you can render them from Next.js server components.

## Install

```sh
pnpm add @khee/react @khee/tokens
```

`react` and `react-dom` 19 are peer dependencies.
`react-aria-components` is installed for you, pinned to an exact version because its props and types are part of Khee's API.

## CSS imports

Import the styles once, in your global stylesheet, in this order:

```css
@import "@khee/tokens/tokens.css";
@import "@khee/react/reset.css"; /* optional */
@import "@khee/react/components.css";
```

All Khee styles live in the `khee` cascade layer, in the order `khee.reset`, `khee.tokens`, `khee.components`.
Your own unlayered CSS always wins, with no specificity fights.

`reset.css` is a small modern reset.
Skip it if your app already has one, such as Tailwind Preflight.

## Button

```tsx
import { Button } from "@khee/react";

export function Example() {
  return (
    <Button variant="secondary" size="sm" onPress={() => console.log("saved")}>
      Save changes
    </Button>
  );
}
```

| Prop      | Values                     | Default     |
| --------- | -------------------------- | ----------- |
| `variant` | `"primary"`, `"secondary"` | `"primary"` |
| `size`    | `"sm"`, `"md"`             | `"md"`      |

Every other prop passes through to React Aria's `Button` (`onPress`, `isDisabled`, `type`, ...).
`className` and `style` accept React Aria's render-function form, and your `className` is added after `khee-button`.
`ref` points to the underlying `<button>`.

Button is `experimental`: its API may change in a minor release until it is marked `stable`.

## Types

Import types from `@khee/react`, never from `react-aria-components`:

```ts
import type { ButtonProps, Key, PressEvent, Selection } from "@khee/react";
```

Every component exports its props type, and the React Aria types apps commonly need are re-exported.

## More

See the [main README](https://github.com/bilegjargal/khee#readme) for theming, Tailwind, Next.js, and RTL.
