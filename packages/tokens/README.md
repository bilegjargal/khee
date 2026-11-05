# @khee/tokens

Design tokens for [Khee](https://github.com/bilegjargal/khee), as one plain CSS file.
No JavaScript, no build step, works with any framework.

## Install

```sh
pnpm add @khee/tokens
```

## Use

Import the file once, before your own styles:

```css
@import "@khee/tokens/tokens.css";
```

Everything lives in the `khee.tokens` cascade layer, so any unlayered CSS in your app wins without specificity fights.
If you use `@khee/react`, it expects these tokens to be loaded.

## Two tiers

| Tier     | Example                                    | Used by                                |
| -------- | ------------------------------------------ | -------------------------------------- |
| Palette  | `--khee-blue-600`                          | Semantic tokens only                   |
| Semantic | `--khee-color-primary`, `--khee-radius-md` | Components, and your theme overrides   |

Palette tokens are raw colors (`gray`, `blue`, and `red`, steps 50 to 950).
They are the same in every theme.
Reference semantic tokens in your own CSS, not palette tokens, so your styles follow the theme.

## Semantic tokens

| Group      | Tokens                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Color      | `--khee-color-background`, `--khee-color-surface`, `--khee-color-text`, `--khee-color-text-muted`, `--khee-color-border`, `--khee-color-primary`, `--khee-color-primary-hover`, `--khee-color-on-primary`, `--khee-color-danger`, `--khee-color-on-danger`, `--khee-color-focus-ring`, `--khee-color-overlay` |
| Space      | `--khee-space-xs`, `--khee-space-sm`, `--khee-space-md`, `--khee-space-lg`                                                                                                                                                                                                                                   |
| Radius     | `--khee-radius-sm`, `--khee-radius-md`, `--khee-radius-full`                                                                                                                                                                                                                                                 |
| Typography | `--khee-font-family`, `--khee-font-size-sm`, `--khee-font-size-md`, `--khee-font-size-lg`, `--khee-font-weight-medium`                                                                                                                                                                                       |
| Shadow     | `--khee-shadow-sm`, `--khee-shadow-lg`                                                                                                                                                                                                                                                                       |
| Motion     | `--khee-duration` (`0ms` when the user prefers reduced motion)                                                                                                                                                                                                                                               |
| Lines      | `--khee-border-width`, `--khee-focus-ring-width`                                                                                                                                                                                                                                                             |

## Themes

The light theme is the default.
Switch themes with `data-theme` on the root element:

```html
<html data-theme="dark"></html>
```

There is no automatic switching based on `prefers-color-scheme`.
Set `data-theme` yourself if you want to follow the system setting.

## Theming by override

Override semantic tokens in your own CSS. No build step is needed:

```css
:root {
  --khee-color-primary: #0f5132;
  --khee-color-primary-hover: #0b3d26;
  --khee-color-on-primary: #ffffff;
  --khee-radius-md: 0.625rem;
}

[data-theme="dark"] {
  --khee-color-primary: #75b798;
  --khee-color-primary-hover: #a3cfbb;
  --khee-color-on-primary: #0b2117;
}
```

When you change colors, keep the guaranteed pairs readable.

## Guaranteed contrast pairs

[`contrast-pairs.json`](./contrast-pairs.json) lists every foreground/background pair Khee guarantees, with its minimum WCAG 2.2 contrast ratio and what it is used for.
A contrast check verifies each pair in every shipped theme, so a failing combination cannot be released.
