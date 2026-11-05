import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";

const pluginPath = fileURLToPath(
  new URL("../stylelint/plugin.js", import.meta.url),
);
const tokensPath = fileURLToPath(new URL("../tokens.css", import.meta.url));

async function lint(
  rule: string,
  code: string,
  codeFilename = "/virtual/component.css",
) {
  const { results } = await stylelint.lint({
    code,
    codeFilename,
    config: { plugins: [pluginPath], rules: { [rule]: true } },
  });
  const [result] = results;
  assert.ok(result);
  return result.warnings.map(({ rule, text }) => ({ rule, text }));
}

describe("khee/no-unknown-token", () => {
  const rule = "khee/no-unknown-token";

  it("accepts defined semantic tokens", async () => {
    assert.deepEqual(
      await lint(
        rule,
        ".khee-x { color: var(--khee-color-text); padding: var(--khee-space-md); }",
      ),
      [],
    );
  });

  it("accepts references with a fallback", async () => {
    assert.deepEqual(
      await lint(rule, ".khee-x { color: var(--khee-color-text, red); }"),
      [],
    );
  });

  it("ignores custom properties outside the khee namespace", async () => {
    assert.deepEqual(
      await lint(rule, ".khee-x { color: var(--app-color); }"),
      [],
    );
  });

  it("flags an undefined token", async () => {
    const warnings = await lint(
      rule,
      ".khee-x { color: var(--khee-color-nope); }",
    );
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0]?.rule, rule);
    assert.match(warnings[0].text, /--khee-color-nope/);
  });

  it("flags every undefined token in one value", async () => {
    const warnings = await lint(
      rule,
      ".khee-x { border: var(--khee-nope-a) solid var(--khee-nope-b); }",
    );
    assert.equal(warnings.length, 2);
  });
});

describe("khee/no-palette-outside-tokens", () => {
  const rule = "khee/no-palette-outside-tokens";

  it("accepts semantic tokens", async () => {
    assert.deepEqual(
      await lint(rule, ".khee-x { color: var(--khee-color-primary); }"),
      [],
    );
  });

  it("flags a palette token in component CSS", async () => {
    const warnings = await lint(
      rule,
      ".khee-x { color: var(--khee-blue-600); }",
    );
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0]?.rule, rule);
    assert.match(warnings[0].text, /--khee-blue-600/);
  });

  it("flags a palette token in an app theme override", async () => {
    const warnings = await lint(
      rule,
      ":root { --khee-color-primary: var(--khee-red-500); }",
    );
    assert.equal(warnings.length, 1);
  });

  it("flags a palette token in a file that is only named tokens.css", async () => {
    const warnings = await lint(
      rule,
      ".khee-x { color: var(--khee-blue-600); }",
      "/some/app/tokens.css",
    );
    assert.equal(warnings.length, 1);
  });

  it("allows palette tokens inside @khee/tokens/tokens.css", async () => {
    assert.deepEqual(
      await lint(
        rule,
        ":root { --khee-color-primary: var(--khee-blue-600); }",
        tokensPath,
      ),
      [],
    );
  });
});
