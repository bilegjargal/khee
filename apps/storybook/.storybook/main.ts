import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig, type UserConfig } from "vite";

const fromRepo = (path: string) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url));

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
  // Render the packages from source, so `pnpm dev` hot reloads without a
  // watch build. The published dist/ output is covered by apps/next-app.
  // Exact-match patterns, so "@khee/react/components.css" never resolves
  // into index.ts.
  viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      resolve: {
        alias: [
          {
            find: /^@khee\/react$/,
            replacement: fromRepo("packages/react/src/index.ts"),
          },
          {
            find: /^@khee\/react\/components\.css$/,
            replacement: fromRepo("packages/react/src/components.css"),
          },
          {
            find: /^@khee\/react\/reset\.css$/,
            replacement: fromRepo("packages/react/src/reset.css"),
          },
          {
            find: /^@khee\/tokens\/tokens\.css$/,
            replacement: fromRepo("packages/tokens/tokens.css"),
          },
        ],
      },
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
