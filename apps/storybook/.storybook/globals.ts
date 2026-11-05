/**
 * Storybook globals. They come from the URL and the toolbar, and Storybook
 * types them loosely, so they are read defensively.
 */
export type Globals = unknown;

const read = (globals: Globals, key: string): unknown =>
  typeof globals === "object" && globals !== null
    ? (globals as Record<string, unknown>)[key]
    : undefined;

export type Theme = "light" | "dark";
export type Direction = "ltr" | "rtl";

export const themeOf = (globals: Globals): Theme =>
  read(globals, "theme") === "dark" ? "dark" : "light";

export const directionOf = (globals: Globals): Direction =>
  read(globals, "direction") === "rtl" ? "rtl" : "ltr";

/**
 * Applies the theme and direction to an element. Light is the default theme
 * in tokens.css, so it removes the attribute instead of setting it.
 */
export function applyThemeAndDirection(
  element: HTMLElement,
  theme: Theme,
  direction: Direction,
) {
  if (theme === "light") {
    element.removeAttribute("data-theme");
  } else {
    element.setAttribute("data-theme", theme);
  }
  element.setAttribute("dir", direction);
}
