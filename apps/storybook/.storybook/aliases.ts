import { fileURLToPath } from "node:url";
import type { Alias } from "vite";

const fromRepo = (path: string) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url));

/**
 * Resolves the packages to their source, so `pnpm dev` hot reloads without a
 * watch build. The published dist/ output is covered by apps/next-app.
 * Exact-match patterns, so "@khee/react/components.css" never resolves into
 * index.ts. Shared by Storybook and every Vitest project.
 */
export const sourceAliases: Alias[] = [
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
];
