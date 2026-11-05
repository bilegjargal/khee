import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { browserCommands } from "./test/browser-commands.ts";

// Tests run in real headless Chromium, so focus, keyboard, and layout behave
// as they do for users. jsdom is not used.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./test/setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      // Failure screenshots land next to the tests as untracked files.
      screenshotFailures: false,
      commands: browserCommands,
    },
  },
});
