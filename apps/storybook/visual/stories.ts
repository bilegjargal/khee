// Shared by the Playwright specs: the stories in the static build, and a
// helper that opens one and waits until it has fully settled.
import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

export interface StoryEntry {
  type: "story" | "docs";
  id: string;
  title: string;
  name: string;
  tags: string[];
}

const indexUrl = new URL("../storybook-static/index.json", import.meta.url);
const { entries } = JSON.parse(readFileSync(indexUrl, "utf8")) as {
  entries: Record<string, StoryEntry>;
};

export const stories = Object.values(entries).filter(
  (entry) => entry.type === "story",
);

/** Elements a user can reach with Tab, in a story's root. */
export const FOCUSABLE =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Narrows a selector list to elements that are not disabled. */
export const enabled = (selector: string) =>
  `:is(${selector}):not(:disabled, [aria-disabled="true"])`;

interface PreviewWindow {
  __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
}

/**
 * Opens a story in its own iframe page, then waits until Storybook has
 * rendered it, run its play function, and fonts have loaded.
 */
export async function openStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await page.waitForFunction(
    () =>
      (window as PreviewWindow).__STORYBOOK_PREVIEW__?.currentRender?.phase ===
      "finished",
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Storybook shows this when a story throws while rendering.
  await expect(page.locator("body")).not.toHaveClass(/sb-show-errordisplay/);
  return page.locator("#storybook-root");
}
