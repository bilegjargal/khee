// Copies tokens.css to dist/ byte for byte. The package has no compile step.
import { copyFile, mkdir, rm } from "node:fs/promises";

const source = new URL("../tokens.css", import.meta.url);
const outDir = new URL("../dist/", import.meta.url);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await copyFile(source, new URL("tokens.css", outDir));
