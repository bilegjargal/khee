// One screenshot per story in every project. Stories tagged "interactive"
// also get hovered and keyboard-focused screenshots.
import { expect, test } from "@playwright/test";
import { enabled, FOCUSABLE, openStory, stories } from "./stories.ts";

/** Projects whose viewport stands in for zoomed-in browsers. */
const REFLOW_PROJECTS = new Set(["zoom-200", "reflow-320"]);

for (const story of stories) {
  test(`${story.title}: ${story.name}`, async ({ page }, testInfo) => {
    const root = await openStory(page, story.id);

    if (REFLOW_PROJECTS.has(testInfo.project.name)) {
      // WCAG 1.4.10: content reflows instead of scrolling sideways.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, "horizontal overflow in CSS pixels").toBeLessThanOrEqual(
        0,
      );
    }

    await expect(root).toHaveScreenshot(`${story.id}.png`);

    if (!story.tags.includes("interactive")) {
      return;
    }
    // Disabled elements still get a hover screenshot, which shows they do not react.
    await root.locator(FOCUSABLE).first().hover();
    await expect(root).toHaveScreenshot(`${story.id}-hover.png`);

    const target = root.locator(enabled(FOCUSABLE)).first();
    if ((await target.count()) === 0) {
      return;
    }

    // Reach the element with real Tab presses, so React Aria sees keyboard
    // modality. A play function may already have moved focus around.
    await page.mouse.move(0, 0);
    for (let presses = 0; presses < 10; presses++) {
      if (
        await target.evaluate((element) => element === document.activeElement)
      ) {
        break;
      }
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
    await expect(root).toHaveScreenshot(`${story.id}-focus.png`);
  });
}
