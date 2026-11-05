import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Every story is a test: it renders, its play function runs, and any axe
// violation fails it (parameters.a11y.test is "error" in preview.tsx).
export default defineConfig({
  plugins: [storybookTest({ configDir: ".storybook" })],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      // Failure screenshots land next to the stories as untracked files.
      screenshotFailures: false,
    },
  },
});
