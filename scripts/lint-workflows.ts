// Lints GitHub Actions workflows and the Dependabot config with actionlint
// (syntax, expressions, and shellcheck on run steps) and zizmor (security
// audits: permissions, template injection, credential persistence, cache
// poisoning, unpinned actions). Both run as containers pinned by tag and
// digest, so nothing is installed from npm.
//
// Usage: node scripts/lint-workflows.ts
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Pinned by tag and by the digest of the multi-platform index.
// Dependabot does not update these; bump them by hand.
const ACTIONLINT =
  "rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667";
const ZIZMOR =
  "ghcr.io/zizmorcore/zizmor:1.31.1@sha256:42d409dbb851d4c5d35a058cf042b828bea1e3f2884378c526eb0974780e18d9";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function docker(args: string[]): number {
  const result = spawnSync("docker", args, { stdio: "inherit" });
  return result.error ? 1 : (result.status ?? 1);
}

function container(image: string, args: string[]): string[] {
  return [
    "run",
    "--rm",
    "--network=none",
    `--volume=${ROOT}:/repo:ro`,
    "--workdir=/repo",
    image,
    ...args,
  ];
}

if (spawnSync("docker", ["info"], { stdio: "ignore" }).status !== 0) {
  console.error(
    "lint:workflows: Docker is not running. Start Docker and try again.",
  );
  process.exit(1);
}

// Images are pulled first, so --network=none can cut the linters off from the
// network while they run.
for (const image of [ACTIONLINT, ZIZMOR]) {
  if (docker(["pull", "--quiet", image]) !== 0) {
    console.error(`lint:workflows: could not pull ${image}`);
    process.exit(1);
  }
}

const actionlint = docker(container(ACTIONLINT, ["-color"]));
const zizmor = docker(
  container(ZIZMOR, ["--offline", "--persona=pedantic", "--color=always", "."]),
);
process.exit(actionlint === 0 && zizmor === 0 ? 0 : 1);
