// @ts-check
// Local Stylelint plugin that enforces the token contract (ADR 0003).
// Not published: it lints this repo's CSS only.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

// Read relative to this file, not the working directory, so the rules work
// no matter where Stylelint is run from.
const TOKENS_PATH = fileURLToPath(new URL("../tokens.css", import.meta.url));
const DEFINED_TOKENS = new Set(
  Array.from(
    readFileSync(TOKENS_PATH, "utf8").matchAll(/(--khee-[a-z0-9-]+)\s*:/g),
    (match) => match[1],
  ),
);

const PALETTE_TOKEN = /^--khee-[a-z]+-\d+$/;
const KHEE_REFERENCE = /var\(\s*(--khee-[\w-]+)/g;

// PostCSS types, derived from Stylelint's so the plugin depends on Stylelint only.
/** @typedef {Parameters<ReturnType<import("stylelint").Rule>>[0]} Root */
/** @typedef {Parameters<Parameters<Root["walkDecls"]>[0]>[0]} Declaration */

/**
 * Calls `onReference` for every `var(--khee-*)` in a declaration value.
 *
 * @param {Root} root
 * @param {(name: string, decl: Declaration) => void} onReference
 */
function walkKheeReferences(root, onReference) {
  root.walkDecls((decl) => {
    for (const match of decl.value.matchAll(KHEE_REFERENCE)) {
      const name = match[1];
      if (name !== undefined) onReference(name, decl);
    }
  });
}

const noUnknownTokenName = "khee/no-unknown-token";
const noUnknownTokenMessages = ruleMessages(noUnknownTokenName, {
  rejected: (/** @type {string} */ name) =>
    `Unknown token "${name}". It is not defined in @khee/tokens/tokens.css.`,
});

/** @type {import("stylelint").Rule} */
const noUnknownToken = (primary) => (root, result) => {
  if (!validateOptions(result, noUnknownTokenName, { actual: primary })) return;
  walkKheeReferences(root, (name, decl) => {
    if (DEFINED_TOKENS.has(name)) return;
    report({
      ruleName: noUnknownTokenName,
      result,
      node: decl,
      word: name,
      message: noUnknownTokenMessages.rejected(name),
    });
  });
};
noUnknownToken.ruleName = noUnknownTokenName;
noUnknownToken.messages = noUnknownTokenMessages;

const noPaletteName = "khee/no-palette-outside-tokens";
const noPaletteMessages = ruleMessages(noPaletteName, {
  rejected: (/** @type {string} */ name) =>
    `Palette token "${name}" used outside tokens.css. Use a semantic token instead.`,
});

/** @type {import("stylelint").Rule} */
const noPaletteOutsideTokens = (primary) => (root, result) => {
  if (!validateOptions(result, noPaletteName, { actual: primary })) return;
  if (root.source?.input.file === TOKENS_PATH) return;
  walkKheeReferences(root, (name, decl) => {
    if (!PALETTE_TOKEN.test(name)) return;
    report({
      ruleName: noPaletteName,
      result,
      node: decl,
      word: name,
      message: noPaletteMessages.rejected(name),
    });
  });
};
noPaletteOutsideTokens.ruleName = noPaletteName;
noPaletteOutsideTokens.messages = noPaletteMessages;

const requireLayerName = "khee/require-layer";
const requireLayerMessages = ruleMessages(requireLayerName, {
  rejected:
    "Expected rules and declarations to be inside an @layer khee.* block (ADR 0002).",
});

/**
 * True for top-level nodes that are allowed outside a khee layer:
 * comments, `@import`, `@layer` statements, and `@layer khee.*` blocks.
 *
 * @param {Root["nodes"][number]} node
 */
function isAllowedAtTopLevel(node) {
  if (node.type === "comment") return true;
  if (node.type !== "atrule") return false;
  const name = node.name.toLowerCase();
  if (name === "import") return true;
  if (name !== "layer") return false;
  if (node.nodes === undefined) return true;
  return node.params.trim().startsWith("khee.");
}

/** @type {import("stylelint").Rule} */
const requireLayer = (primary) => (root, result) => {
  if (!validateOptions(result, requireLayerName, { actual: primary })) return;
  for (const node of root.nodes) {
    if (isAllowedAtTopLevel(node)) continue;
    report({
      ruleName: requireLayerName,
      result,
      node,
      message: requireLayerMessages.rejected,
    });
  }
};
requireLayer.ruleName = requireLayerName;
requireLayer.messages = requireLayerMessages;

export default [
  createPlugin(noUnknownTokenName, noUnknownToken),
  createPlugin(noPaletteName, noPaletteOutsideTokens),
  createPlugin(requireLayerName, requireLayer),
];
