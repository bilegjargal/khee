// Compiles src/ with plain tsc (ADR 0007), then copies every CSS file to the
// same path under dist/, byte for byte. CSS is never compiled.
import { execFileSync } from "node:child_process";
import { copyFile, glob, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, "src");
const outDir = join(root, "dist");

await rm(outDir, { recursive: true, force: true });

execFileSync("tsc", ["-p", "tsconfig.build.json"], {
  cwd: root,
  stdio: "inherit",
});

for await (const file of glob("**/*.css", { cwd: srcDir })) {
  const target = join(outDir, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(srcDir, file), target);
}
