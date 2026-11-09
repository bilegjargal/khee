// Packs every publishable package and checks the tarballs the way npm would
// ship them, covering what the workspace link hides: `files`, the `exports`
// map, and type resolution from a real install.
//
// 1. `pnpm pack` each package and apply the rules in pack-rules.ts.
// 2. Extract the tarballs into a throwaway consumer outside the workspace,
//    linking their dependencies from the workspace's own installed copies,
//    so there is no network access and no dependency resolution.
// 3. Type-check a fixture against the packed types with NodeNext, import the
//    packed JavaScript in Node, and resolve every CSS entry point.
//
// Assumes `pnpm build` has run. It never builds anything itself.
//
// Usage: node scripts/check-pack.ts
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTarball, type PackedManifest } from "./pack-rules.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Type packages the fixture needs that are not runtime dependencies.
const TYPE_PACKAGES = ["@types/react", "@types/react-dom"];

// The consumer fixture. It uses the components and the re-exported React Aria
// types, so a broken .d.ts or a missing type re-export fails the check.
const FIXTURE = `import { Button, type ButtonProps, type Key, type PressEvent, type Selection } from "@khee/react";
import type { ReactElement } from "react";

const props: ButtonProps = { variant: "secondary", size: "sm", onPress: (event: PressEvent) => event.target };
export const button: ReactElement = <Button {...props}>Save</Button>;
export type ReExported = [Key, Selection];
`;

const FIXTURE_TSCONFIG = {
  compilerOptions: {
    target: "ES2022",
    lib: ["ES2022", "DOM"],
    module: "NodeNext",
    moduleResolution: "NodeNext",
    jsx: "react-jsx",
    strict: true,
    noEmit: true,
    types: [],
  },
  files: ["index.tsx"],
};

interface Workspace {
  dir: string;
  manifest: PackedManifest & { private?: boolean };
}

interface Packed {
  workspace: Workspace;
  tarball: string;
  manifest: PackedManifest;
}

class CheckError extends Error {}

function run(
  command: string,
  args: string[],
  cwd: string,
): { stdout: string; stderr: string } {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error) {
    throw new CheckError(`could not run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const name = command === process.execPath ? "node" : command;
    const where = cwd.startsWith(ROOT) ? relative(ROOT, cwd) || "." : cwd;
    throw new CheckError(
      `${name} ${args.join(" ")} failed in ${where}\n${result.stdout}${result.stderr}`,
    );
  }
  return { stdout: result.stdout, stderr: result.stderr };
}

function publishableWorkspaces(): Workspace[] {
  const packagesDir = join(ROOT, "packages");
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name))
    .filter((dir) => existsSync(join(dir, "package.json")))
    .map((dir) => ({
      dir,
      manifest: JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      ) as Workspace["manifest"],
    }))
    .filter(({ manifest }) => manifest.private !== true);
}

function pack(workspace: Workspace, destination: string): Packed {
  const { stdout } = run(
    "pnpm",
    ["pack", "--pack-destination", destination, "--json"],
    workspace.dir,
  );
  const { filename, files } = JSON.parse(stdout) as {
    filename: string;
    files: { path: string }[];
  };
  const manifest = JSON.parse(
    run("tar", ["-xOzf", filename, "package/package.json"], destination).stdout,
  ) as PackedManifest;

  const problems = checkTarball(
    manifest,
    files.map((file) => file.path),
  );
  if (problems.length > 0) {
    throw new CheckError(
      `${manifest.name} tarball:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
    );
  }
  console.log(
    `${manifest.name}: ${String(files.length)} files, tarball rules pass`,
  );
  return { workspace, tarball: filename, manifest };
}

/** Links `name` into the consumer from where the workspace package resolves it. */
function linkDependency(
  consumerModules: string,
  fromDir: string,
  name: string,
) {
  const target = join(consumerModules, name);
  if (existsSync(target)) return;
  const source = join(fromDir, "node_modules", name);
  if (!existsSync(source)) {
    throw new CheckError(
      `${name} is not installed in ${relative(ROOT, fromDir)}. Run pnpm install.`,
    );
  }
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(realpathSync(source), target, "dir");
}

function buildConsumer(packed: Packed[], consumer: string) {
  const modules = join(consumer, "node_modules");
  for (const { manifest, tarball } of packed) {
    const target = join(modules, manifest.name);
    mkdirSync(target, { recursive: true });
    run(
      "tar",
      ["-xzf", tarball, "-C", target, "--strip-components=1"],
      consumer,
    );
  }
  const ours = new Set(packed.map(({ manifest }) => manifest.name));
  for (const { manifest, workspace } of packed) {
    const names = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ].filter((name) => !ours.has(name));
    for (const name of names) linkDependency(modules, workspace.dir, name);
  }
  const react = packed.find(({ manifest }) => manifest.name === "@khee/react");
  if (react) {
    for (const name of TYPE_PACKAGES)
      linkDependency(modules, react.workspace.dir, name);
  }
  writeFileSync(
    join(consumer, "package.json"),
    '{ "type": "module", "private": true }\n',
  );
}

function typeCheck(consumer: string) {
  writeFileSync(join(consumer, "index.tsx"), FIXTURE);
  writeFileSync(
    join(consumer, "tsconfig.json"),
    `${JSON.stringify(FIXTURE_TSCONFIG, null, 2)}\n`,
  );
  const tsc = createRequire(join(ROOT, "package.json")).resolve(
    "typescript/bin/tsc",
  );
  run(process.execPath, [tsc, "-p", "tsconfig.json"], consumer);
  console.log(
    "consumer fixture type-checks against the packed types (NodeNext)",
  );
}

function resolveEntryPoints(packed: Packed[], consumer: string) {
  const specifiers = packed.flatMap(({ manifest }) =>
    Object.keys((manifest.exports ?? {}) as Record<string, unknown>).map(
      (key) =>
        key === "." ? manifest.name : `${manifest.name}/${key.slice(2)}`,
    ),
  );
  // Resolves every export from inside the consumer, checks the file exists,
  // and imports the JavaScript entry points to prove the ESM output loads.
  const script = `import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
for (const specifier of ${JSON.stringify(specifiers)}) {
  const url = import.meta.resolve(specifier);
  if (!existsSync(fileURLToPath(url))) throw new Error(specifier + " resolves to a missing file");
  if (!url.endsWith(".css")) await import(specifier);
  console.log("  " + specifier);
}
`;
  writeFileSync(join(consumer, "resolve.mjs"), script);
  const { stdout } = run(process.execPath, ["resolve.mjs"], consumer);
  console.log(`every export resolves and loads:\n${stdout.trimEnd()}`);
}

const temp = mkdtempSync(join(tmpdir(), "khee-check-pack-"));
let failed = false;
try {
  const workspaces = publishableWorkspaces();
  if (workspaces.length === 0)
    throw new CheckError("found no publishable packages.");
  const packed = workspaces.map((workspace) => pack(workspace, temp));
  const consumer = join(temp, "consumer");
  mkdirSync(consumer);
  buildConsumer(packed, consumer);
  typeCheck(consumer);
  resolveEntryPoints(packed, consumer);
} catch (error) {
  failed = true;
  console.error(
    `check:pack: ${error instanceof Error ? error.message : String(error)}`,
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
