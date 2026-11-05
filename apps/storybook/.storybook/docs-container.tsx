import {
  DocsContainer as BaseDocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { type PropsWithChildren, useEffect, useState } from "react";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { themes } from "storybook/theming";
import {
  applyThemeAndDirection,
  directionOf,
  type Globals,
  themeOf,
} from "./globals.ts";

interface GlobalsUpdatedPayload {
  userGlobals: Globals;
}

/** The theme and direction picked in the toolbar, kept current. */
function useToolbarGlobals(context: DocsContainerProps["context"]) {
  const [globals, setGlobals] = useState<Globals>(() => {
    // The primary story has no story-level globals, so these are the toolbar's.
    const initial: Globals = context.getStoryContext(
      context.storyById(),
    ).globals;
    return initial;
  });

  useEffect(() => {
    const onUpdate = ({ userGlobals }: GlobalsUpdatedPayload) => {
      setGlobals(userGlobals);
    };
    context.channel.on(GLOBALS_UPDATED, onUpdate);
    return () => {
      context.channel.off(GLOBALS_UPDATED, onUpdate);
    };
  }, [context.channel]);

  return globals;
}

/**
 * Follows the toolbar on docs pages: Storybook's own docs theme switches with
 * the theme global, and the page root gets the theme and direction.
 * Individual stories on the page are scoped by the decorator in preview.tsx,
 * so a story-level `globals: { theme: "dark" }` never flips the whole page.
 */
export function DocsContainer({
  context,
  children,
}: PropsWithChildren<DocsContainerProps>) {
  const globals = useToolbarGlobals(context);
  const theme = themeOf(globals);
  const direction = directionOf(globals);

  useEffect(() => {
    applyThemeAndDirection(document.documentElement, theme, direction);
  }, [theme, direction]);

  return (
    <BaseDocsContainer
      context={context}
      theme={theme === "dark" ? themes.dark : themes.light}
    >
      {children}
    </BaseDocsContainer>
  );
}
