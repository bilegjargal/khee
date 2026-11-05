import "@khee/tokens/tokens.css";
import "@khee/react/reset.css";
import "@khee/react/components.css";
import "./preview.css";
import "./docs.css";
import type { Decorator, Preview } from "@storybook/react-vite";
import { type ReactNode, useLayoutEffect } from "react";
import { DocsContainer } from "./docs-container.tsx";
import {
  applyThemeAndDirection,
  type Direction,
  directionOf,
  type Theme,
  themeOf,
} from "./globals.ts";

interface ThemeAndDirectionProps {
  theme: Theme;
  direction: Direction;
  isDocs: boolean;
  children: ReactNode;
}

/**
 * In story view the theme and direction go on the root element. On docs pages
 * each story gets its own scope, so a story with `globals: { theme: "dark" }`
 * does not change the rest of the page.
 */
function ThemeAndDirection({
  theme,
  direction,
  isDocs,
  children,
}: ThemeAndDirectionProps) {
  useLayoutEffect(() => {
    if (!isDocs) {
      applyThemeAndDirection(document.documentElement, theme, direction);
    }
  }, [isDocs, theme, direction]);

  if (!isDocs) {
    return children;
  }
  return (
    <div
      className="khee-sb-scope"
      data-theme={theme === "light" ? undefined : theme}
      dir={direction}
    >
      {children}
    </div>
  );
}

const withThemeAndDirection: Decorator = (Story, context) => (
  <ThemeAndDirection
    theme={themeOf(context.globals)}
    direction={directionOf(context.globals)}
    isDocs={context.viewMode === "docs"}
  >
    <Story />
  </ThemeAndDirection>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: "Text direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    direction: "ltr",
  },
  decorators: [withThemeAndDirection],
  parameters: {
    layout: "centered",
    docs: {
      container: DocsContainer,
    },
  },
  tags: ["autodocs"],
};

export default preview;
