// Runs the visual regression suite with the browser in Docker.
//
// Only the browser runs in the container: the official Playwright image runs
// `playwright run-server`, and the tests on the host connect to it. No
// node_modules are shared across operating systems, and fonts render the same
// on every machine.
//
// Usage: node scripts/visual.ts [playwright test arguments]
// For example: node scripts/visual.ts --update-snapshots
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Pinned by tag and by the digest of the multi-platform index.
// The tag version must equal the root `playwright` devDependency.
const IMAGE =
  "mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f";

// Baselines come from the amd64 image on every machine, including Apple
// Silicon (through emulation) and CI, so screenshots match pixel for pixel.
const PLATFORM = "linux/amd64";

const PORT = 3000;
const READY_TIMEOUT_MS = 180_000;
const CONTAINER = `khee-playwright-${String(process.pid)}`;

function fail(message: string): never {
  throw new Error(message);
}

function playwrightVersion(): string {
  const root = new URL("../../../package.json", import.meta.url);
  const { devDependencies } = JSON.parse(readFileSync(root, "utf8")) as {
    devDependencies: Record<string, string>;
  };
  const version = devDependencies.playwright;
  if (!version) {
    fail("the root package.json has no playwright devDependency.");
  }
  return version;
}

function checkImageMatchesPlaywright(version: string) {
  if (!IMAGE.includes(`:v${version}-noble@sha256:`)) {
    fail(
      `the Playwright image does not match playwright ${version}. ` +
        "Update IMAGE in scripts/visual.ts to that version and its digest.",
    );
  }
}

function checkDocker() {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    fail("Docker is not running. Start Docker and try again.");
  }
}

function stopContainer() {
  spawnSync("docker", ["rm", "--force", CONTAINER], { stdio: "ignore" });
}

function startContainer(version: string) {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--detach",
      // No --rm: a crashed container keeps its logs until stopContainer().
      "--init",
      "--ipc=host",
      `--platform=${PLATFORM}`,
      `--name=${CONTAINER}`,
      // Reachable from this machine only.
      `--publish=127.0.0.1:${String(PORT)}:${String(PORT)}`,
      "--user=pwuser",
      "--workdir=/home/pwuser",
      IMAGE,
      "npx",
      "--yes",
      `playwright@${version}`,
      "run-server",
      `--port=${String(PORT)}`,
      "--host=0.0.0.0",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (result.status !== 0) {
    fail("could not start the Playwright container.");
  }
}

function containerLogs(): { ok: boolean; text: string } {
  const logs = spawnSync("docker", ["logs", CONTAINER], { encoding: "utf8" });
  return { ok: logs.status === 0, text: `${logs.stdout}${logs.stderr}` };
}

function containerRunning(): boolean {
  const state = spawnSync(
    "docker",
    ["inspect", "--format={{.State.Running}}", CONTAINER],
    { encoding: "utf8" },
  );
  return state.stdout.trim() === "true";
}

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const logs = containerLogs();
    if (logs.text.includes("Listening on")) {
      return;
    }
    if (!logs.ok || !containerRunning()) {
      fail(
        `the Playwright container exited before the server started.\n${logs.text}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(
    `the Playwright server did not start within ${String(READY_TIMEOUT_MS / 1000)}s.\n${containerLogs().text}`,
  );
}

function runTests(args: string[]): Promise<number> {
  return new Promise((resolve) => {
    // Resolved from @playwright/test, so it works with or without pnpm on PATH.
    const cli = createRequire(import.meta.url).resolve("@playwright/test/cli");
    const child = spawn(process.execPath, [cli, "test", ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        PW_TEST_CONNECT_WS_ENDPOINT: `ws://127.0.0.1:${String(PORT)}/`,
      },
    });
    child.on("error", (error) => {
      console.error(`test:visual: could not run Playwright: ${error.message}`);
      resolve(1);
    });
    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

// Always remove the container, whether the tests pass, fail, or are interrupted.
for (const [signal, code] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
] as const) {
  process.on(signal, () => {
    stopContainer();
    process.exit(code);
  });
}

let exitCode = 1;
try {
  const version = playwrightVersion();
  checkImageMatchesPlaywright(version);
  checkDocker();
  startContainer(version);
  await waitForServer();
  exitCode = await runTests(process.argv.slice(2));
} catch (error) {
  console.error(
    `test:visual: ${error instanceof Error ? error.message : String(error)}`,
  );
} finally {
  stopContainer();
}
process.exit(exitCode);
