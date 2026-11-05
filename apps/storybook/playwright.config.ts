import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig } from "@playwright/test";

// The static build is served on the host. The browser runs in the pinned
// Playwright image (scripts/visual.ts) and reaches the host through
// exposeNetwork, so fonts render the same on every machine.
const PORT = "6007";
const ORIGIN = `http://127.0.0.1:${PORT}`;

// Vite's CLI, resolved from the package so the server starts without pnpm on PATH.
const vitePackage = createRequire(import.meta.url).resolve("vite/package.json");
const viteBin = join(dirname(vitePackage), "bin", "vite.js");

export default defineConfig({
  testDir: "visual",
  fullyParallel: true,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // The browser always runs in the same Linux image, so no OS suffix.
  snapshotPathTemplate: "visual/__screenshots__/{projectName}/{arg}{ext}",
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css" },
  },
  use: {
    browserName: "chromium",
    baseURL: ORIGIN,
    deviceScaleFactor: 1,
    connectOptions: {
      wsEndpoint:
        process.env.PW_TEST_CONNECT_WS_ENDPOINT ?? "ws://127.0.0.1:3000/",
      exposeNetwork: "<loopback>",
    },
  },
  webServer: {
    command: `"${process.execPath}" "${viteBin}" preview --outDir storybook-static --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `${ORIGIN}/index.json`,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "default",
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: "forced-colors",
      testMatch: "stories.spec.ts",
      use: { viewport: { width: 1280, height: 720 }, forcedColors: "active" },
    },
  ],
});
