// User preference checks, run for every story. These are assertions rather
// than screenshots, so they run in the default project only.
import { expect, test } from "@playwright/test";
import { FOCUSABLE, openStory, stories } from "./stories.ts";

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  for (const story of stories) {
    test(`${story.title}: ${story.name}`, async ({ page }) => {
      await openStory(page, story.id);

      // --khee-duration is 0ms under reduced motion, which computes to 0s.
      const moving = await page.evaluate(() =>
        [...document.querySelectorAll("#storybook-root *")].flatMap(
          (element) => {
            const style = getComputedStyle(element);
            const durations = [
              ...style.transitionDuration.split(","),
              ...style.animationDuration.split(","),
            ].map((value) => value.trim());
            return durations.every((value) => value === "0s")
              ? []
              : [
                  `${element.tagName.toLowerCase()}.${element.className}: ${durations.join(", ")}`,
                ];
          },
        ),
      );
      expect(moving).toEqual([]);
    });
  }
});

test.describe("text at 200%", () => {
  for (const story of stories) {
    test(`${story.title}: ${story.name}`, async ({ page }) => {
      await openStory(page, story.id);

      // Tokens use rem, so components scale with the user's font size.
      await page.addStyleTag({ content: "html { font-size: 200%; }" });

      const clipped = await page.evaluate(
        (selector) =>
          [
            ...document.querySelectorAll(`#storybook-root :is(${selector})`),
          ].flatMap((element) =>
            element.scrollWidth <= element.clientWidth &&
            element.scrollHeight <= element.clientHeight
              ? []
              : [element.outerHTML.slice(0, 120)],
          ),
        FOCUSABLE,
      );
      expect(clipped).toEqual([]);
    });
  }
});
