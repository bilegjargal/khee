import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  checkContrast,
  collectThemes,
  type ContrastPair,
} from "../scripts/check-contrast.ts";

const script = fileURLToPath(
  new URL("../scripts/check-contrast.ts", import.meta.url),
);
const fixture = fileURLToPath(
  new URL("fixtures/low-contrast.css", import.meta.url),
);

const pair: ContrastPair = {
  foreground: "--khee-color-text",
  background: "--khee-color-surface",
  min: 4.5,
  use: "body text",
};

function run(css: string, pairs: readonly ContrastPair[] = [pair]) {
  return checkContrast(collectThemes(css), pairs);
}

describe("collectThemes", () => {
  it("finds :root and every data-theme block, including inside @layer", () => {
    const themes = collectThemes(`
      @layer khee.tokens {
        :root { --khee-a: #000000; }
        [data-theme="dark"] { --khee-a: #ffffff; }
      }
      [data-theme='brand'] { --khee-a: #ff0000; }
    `);
    assert.deepEqual([...themes.keys()], ["default", "dark", "brand"]);
    assert.equal(themes.get("brand")?.get("--khee-a"), "#ff0000");
  });

  it("ignores rules inside @media and unrelated selectors", () => {
    const themes = collectThemes(`
      :root { --khee-a: #000000; }
      @media (prefers-reduced-motion: reduce) { :root { --khee-a: #ffffff; } }
      .khee-x { --khee-a: #ff0000; }
    `);
    assert.deepEqual([...themes.keys()], ["default"]);
    assert.equal(themes.get("default")?.get("--khee-a"), "#000000");
  });
});

describe("checkContrast", () => {
  it("follows var() chains to hex values", () => {
    const [result] = run(`:root {
      --khee-black-1: #000000;
      --khee-white-1: #ffffff;
      --khee-color-text: var(--khee-black-1);
      --khee-color-surface: var(--khee-white-1);
    }`);
    assert.equal(result?.ratio, 21);
    assert.equal(result.pass, true);
  });

  it("falls back to :root for tokens a theme does not override", () => {
    const results = run(`
      :root { --khee-color-text: #000000; --khee-color-surface: #ffffff; }
      [data-theme="dim"] { --khee-color-surface: #000000; }
    `);
    assert.deepEqual(
      results.map((r) => [r.theme, r.ratio, r.pass]),
      [
        ["default", 21, true],
        ["dim", 1, false],
      ],
    );
  });

  it("resolves theme overrides of palette tokens before :root", () => {
    const [, dark] = run(`
      :root { --khee-gray-1: #000000; --khee-color-text: var(--khee-gray-1); --khee-color-surface: #ffffff; }
      [data-theme="dark"] { --khee-gray-1: #ffffff; }
    `);
    assert.equal(dark?.ratio, 1);
  });

  it("fails a pair below its minimum", () => {
    const [result] = run(
      `:root { --khee-color-text: #777777; --khee-color-surface: #ffffff; }`,
    );
    assert.equal(result?.pass, false);
    assert.equal(result.error, null);
  });

  it("fails undefined, non-hex, and circular tokens", () => {
    const cases = {
      undefined: `:root { --khee-color-surface: #ffffff; }`,
      "not an opaque 6-digit hex": `:root { --khee-color-text: #000; --khee-color-surface: #ffffff; }`,
      circular: `:root { --khee-color-text: var(--khee-color-surface); --khee-color-surface: var(--khee-color-text); }`,
    };
    const expected = {
      undefined: /--khee-color-text is not defined/,
      "not an opaque 6-digit hex": /not an opaque 6-digit hex color/,
      circular: /circular reference/,
    };
    for (const [name, css] of Object.entries(cases)) {
      const [result] = run(css);
      assert.equal(result?.pass, false, name);
      assert.match(
        result.error ?? "",
        expected[name as keyof typeof expected],
        name,
      );
    }
  });
});

describe("check-contrast CLI", () => {
  it("passes for the shipped tokens.css", () => {
    const { status, stdout } = spawnSync(process.execPath, [script], {
      encoding: "utf8",
    });
    assert.equal(status, 0, stdout);
    assert.match(stdout, /^default\s/m);
    assert.match(stdout, /^dark\s/m);
  });

  it("fails for the low-contrast fixture and names the failing theme", () => {
    const { status, stdout } = spawnSync(process.execPath, [script, fixture], {
      encoding: "utf8",
    });
    assert.equal(status, 1);
    assert.match(stdout, /^faded\s+--khee-color-text-muted\s.*FAIL/m);
    assert.doesNotMatch(stdout, /^default\s.*FAIL/m);
  });
});
