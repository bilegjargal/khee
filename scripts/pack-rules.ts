// Rules for a packed npm tarball, checked by check-pack.ts.
// Pure functions, so they can be unit-tested without packing anything.
import { matchesGlob } from "node:path";

export interface PackedManifest {
  name: string;
  exports?: unknown;
  sideEffects?: boolean | string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const LIFECYCLE_SCRIPTS = ["preinstall", "install", "postinstall", "prepare"];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
] as const;

const FORBIDDEN_FILES: { pattern: RegExp; reason: string }[] = [
  { pattern: /(^|\/)[^/]+\.(test|spec)\.[^/]+$/, reason: "a test file" },
  { pattern: /(^|\/)[^/]+\.stories\.[^/]+$/, reason: "a story" },
  { pattern: /(^|\/)tsconfig[^/]*\.json$/, reason: "a tsconfig" },
  { pattern: /^scripts\//, reason: "a repo script" },
];

function stripDotSlash(path: string): string {
  return path.startsWith("./") ? path.slice(2) : path;
}

/** Every file path an `exports` map points to, including `types` conditions. */
export function exportTargets(exports: unknown): string[] {
  if (typeof exports === "string") return [stripDotSlash(exports)];
  if (Array.isArray(exports)) return exports.flatMap(exportTargets);
  if (exports !== null && typeof exports === "object") {
    return Object.values(exports).flatMap(exportTargets);
  }
  return [];
}

/** Returns a list of problems with a packed package, empty when it is fine. */
export function checkTarball(
  manifest: PackedManifest,
  files: readonly string[],
): string[] {
  const problems: string[] = [];
  const fileSet = new Set(files);

  const targets = exportTargets(manifest.exports);
  if (targets.length === 0) {
    problems.push("has no exports map");
  }
  for (const target of targets) {
    if (!fileSet.has(target)) {
      problems.push(`exports points to ${target}, which is not in the tarball`);
    }
  }

  for (const file of files) {
    const forbidden = FORBIDDEN_FILES.find(({ pattern }) => pattern.test(file));
    if (forbidden) {
      problems.push(`contains ${forbidden.reason}: ${file}`);
    }
  }

  for (const script of LIFECYCLE_SCRIPTS) {
    if (manifest.scripts?.[script] !== undefined) {
      problems.push(`has a "${script}" script`);
    }
  }

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (range.startsWith("workspace:")) {
        problems.push(`${field} still has ${name}@${range}`);
      }
    }
  }

  if (Array.isArray(manifest.sideEffects)) {
    for (const entry of manifest.sideEffects) {
      const pattern = stripDotSlash(entry);
      if (!files.some((file) => matchesGlob(file, pattern))) {
        problems.push(`sideEffects entry ${entry} matches no file`);
      }
    }
  }

  return problems;
}
