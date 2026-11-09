import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkTarball,
  exportTargets,
  type PackedManifest,
} from "./pack-rules.ts";

const manifest: PackedManifest = {
  name: "@khee/example",
  exports: {
    ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
  },
  sideEffects: ["**/*.css"],
  dependencies: { "react-aria-components": "1.22.1" },
  peerDependencies: { react: "^19.0.0" },
};

const files = [
  "package.json",
  "README.md",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/styles.css",
];

describe("exportTargets", () => {
  it("collects nested conditions, including types", () => {
    assert.deepEqual(exportTargets(manifest.exports), [
      "dist/index.d.ts",
      "dist/index.js",
      "dist/styles.css",
    ]);
  });

  it("accepts a plain string export", () => {
    assert.deepEqual(exportTargets("./dist/index.js"), ["dist/index.js"]);
  });
});

describe("checkTarball", () => {
  it("accepts a well-formed package", () => {
    assert.deepEqual(checkTarball(manifest, files), []);
  });

  it("rejects a missing exports target", () => {
    const problems = checkTarball(
      manifest,
      files.filter((file) => file !== "dist/styles.css"),
    );
    assert.equal(problems.length, 2);
    assert.match(problems[0] ?? "", /dist\/styles\.css/);
    assert.match(problems[1] ?? "", /sideEffects entry \*\*\/\*\.css/);
  });

  it("rejects a missing types file", () => {
    const problems = checkTarball(
      manifest,
      files.filter((file) => file !== "dist/index.d.ts"),
    );
    assert.deepEqual(problems, [
      "exports points to dist/index.d.ts, which is not in the tarball",
    ]);
  });

  it("rejects a package with no exports map", () => {
    const withoutExports: PackedManifest = { name: manifest.name };
    assert.deepEqual(checkTarball(withoutExports, files), [
      "has no exports map",
    ]);
  });

  for (const file of [
    "dist/button.test.js",
    "src/button.spec.tsx",
    "stories/button.stories.tsx",
    "tsconfig.json",
    "tsconfig.build.json",
    "scripts/build.ts",
  ]) {
    it(`rejects ${file}`, () => {
      const problems = checkTarball(manifest, [...files, file]);
      assert.equal(problems.length, 1);
      assert.match(problems[0] ?? "", new RegExp(file.replace(/\./g, "\\.")));
    });
  }

  for (const script of ["preinstall", "install", "postinstall", "prepare"]) {
    it(`rejects a ${script} script`, () => {
      assert.deepEqual(
        checkTarball(
          { ...manifest, scripts: { [script]: "node x.js" } },
          files,
        ),
        [`has a "${script}" script`],
      );
    });
  }

  it("allows other scripts", () => {
    assert.deepEqual(
      checkTarball({ ...manifest, scripts: { build: "tsc" } }, files),
      [],
    );
  });

  it("rejects a workspace: range left in any dependency field", () => {
    assert.deepEqual(
      checkTarball(
        { ...manifest, devDependencies: { "@khee/tokens": "workspace:*" } },
        files,
      ),
      ["devDependencies still has @khee/tokens@workspace:*"],
    );
  });

  it("matches sideEffects entries written with a leading ./", () => {
    assert.deepEqual(
      checkTarball({ ...manifest, sideEffects: ["./dist/styles.css"] }, files),
      [],
    );
  });

  it("rejects a sideEffects entry that matches nothing", () => {
    assert.deepEqual(
      checkTarball({ ...manifest, sideEffects: ["./dist/missing.css"] }, files),
      ["sideEffects entry ./dist/missing.css matches no file"],
    );
  });
});
