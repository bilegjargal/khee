import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig, type UserConfig } from "vite";
import { sourceAliases } from "./aliases.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../stories/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      resolve: { alias: sourceAliases },
      build: {
        rolldownOptions: {
          // "use client" matters to React Server Components bundlers, not to
          // Storybook, so dropping it from this bundle is expected.
          onLog(level, log, defaultHandler) {
            if (
              log.code === "MODULE_LEVEL_DIRECTIVE" &&
              log.message.includes('"use client"')
            ) {
              return;
            }
            defaultHandler(level, log);
          },
        },
      },
    } satisfies UserConfig);
  },
};

export default config;
