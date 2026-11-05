// Server-side browser commands for tests that need Playwright input which
// Vitest's userEvent does not expose, such as holding the mouse button down.
import type { BrowserCommand } from "vitest/node";

const pointerDown: BrowserCommand<[selector: string]> = async (
  { iframe, page },
  selector,
) => {
  await iframe.locator(selector).hover();
  await page.mouse.down();
};

const pointerUp: BrowserCommand = async ({ page }) => {
  await page.mouse.up();
};

export const browserCommands = { pointerDown, pointerUp };

declare module "vitest/browser" {
  interface BrowserCommands {
    /** Moves the mouse over the element and presses the button without releasing it. */
    pointerDown: (selector: string) => Promise<void>;
    /** Releases the mouse button. */
    pointerUp: () => Promise<void>;
  }
}
