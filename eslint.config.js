// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "**/dist/",
      "**/coverage/",
      "**/.turbo/",
      "**/.next/",
      "**/storybook-static/",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // node:test's describe() and it() return promises the runner tracks itself.
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            {
              from: "package",
              package: "node:test",
              name: ["describe", "it", "test", "suite"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    // Story rules for story files, and the addon check for main.ts.
    files: ["apps/storybook/{stories,.storybook}/**"],
    extends: [storybook.configs["flat/recommended"]],
  },
  {
    // Code that runs in the browser. Playwright specs pass callbacks to the page.
    files: [
      "packages/react/src/**",
      "apps/next-app/**",
      "apps/storybook/{.storybook,stories,visual}/**",
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Plain JS config files are not part of any tsconfig project.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
);
