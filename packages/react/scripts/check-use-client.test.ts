import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { checkSource, findOffenders } from "./check-use-client.ts";

const script = fileURLToPath(new URL("check-use-client.ts", import.meta.url));

const FIXTURES = {
  "passing.js": `"use client";\nimport { Button } from "react-aria-components";\nexport { Button };\n`,
  "missing.js": `import { Button } from "react-aria-components";\nexport { Button };\n`,
  "not-first.js": `import { useState } from "react";\n"use client";\nexport { useState };\n`,
  "static/plain.js": `import { jsx } from "react/jsx-runtime";\nexport const x = jsx("div", {});\n`,
};

describe("checkSource", () => {
  it("accepts an interactive file that starts with the directive", () => {
    assert.equal(checkSource("a.js", FIXTURES["passing.js"]), true);
  });

  it("rejects an interactive file without the directive", () => {
    assert.equal(checkSource("a.js", FIXTURES["missing.js"]), false);
  });

  it("rejects a directive that is not the first statement", () => {
    assert.equal(checkSource("a.js", FIXTURES["not-first.js"]), false);
  });

  it("allows a non-interactive file without the directive", () => {
    assert.equal(checkSource("a.js", FIXTURES["static/plain.js"]), true);
  });

  it("treats a renamed hook import from react as interactive", () => {
    assert.equal(
      checkSource("a.js", `import { useId as id } from "react";\n`),
      false,
    );
  });

  it("does not treat non-hook react imports as interactive", () => {
    assert.equal(
      checkSource("a.js", `import { createContext, user } from "react";\n`),
      true,
    );
  });
});

describe("check-use-client CLI", () => {
  let dir: string;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "khee-use-client-"));
    await mkdir(join(dir, "static"));
    for (const [file, text] of Object.entries(FIXTURES)) {
      await writeFile(join(dir, file), text);
    }
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("finds exactly the offending files", async () => {
    assert.deepEqual(await findOffenders(dir), ["missing.js", "not-first.js"]);
  });

  it("lists offenders and exits 1", async () => {
    await assert.rejects(
      promisify(execFile)("node", [script, dir]),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal((error as Error & { code: unknown }).code, 1);
        const { stderr } = error as Error & { stderr: string };
        assert.match(stderr, /missing\.js/);
        assert.match(stderr, /not-first\.js/);
        assert.doesNotMatch(stderr, /passing\.js|plain\.js/);
        return true;
      },
    );
  });

  it("exits 0 when every interactive file has the directive", async () => {
    await rm(join(dir, "missing.js"));
    await rm(join(dir, "not-first.js"));
    await promisify(execFile)("node", [script, dir]);
  });
});
