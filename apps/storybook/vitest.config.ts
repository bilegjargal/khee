import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { sourceAliases } from "./.storybook/aliases.ts";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      // Failure screenshots land next to the stories as untracked files.
      screenshotFailures: false,
    },
    projects: [
      {
        // Every story is a test: it renders, its play function runs, and any
        // axe violation fails it (parameters.a11y.test is "error" in
        // preview.tsx). The plugin sets its own include from the stories glob.
        extends: true,
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: { name: "stories" },
      },
      {
        // Checks over every story file's meta, loaded the way Storybook loads it.
        extends: true,
        resolve: { alias: sourceAliases },
        test: {
          name: "meta",
          include: ["stories/check-docs-content.test.ts"],
        },
      },
    ],
  },
});
