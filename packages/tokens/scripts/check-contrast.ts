// Checks every documented foreground/background pair in every theme.
//
// Usage: node scripts/check-contrast.ts [path/to/tokens.css]
//
// Themes are found automatically: the default theme on `:root`, plus every
// `[data-theme="..."]` block. Each token is resolved with the theme's own
// value first, then the `:root` value, following `var()` chains to a hex color.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postcss, { type Rule } from "postcss";
import { contrastRatio, isHex } from "./contrast.ts";

export interface ContrastPair {
  foreground: string;
  background: string;
  min: number;
  use: string;
}

export interface PairResult extends ContrastPair {
  theme: string;
  ratio: number | null;
  error: string | null;
  pass: boolean;
}

const DEFAULT_THEME = "default";
const DATA_THEME = /\[data-theme=(["']?)([^"'\]]+)\1\]/;
const VAR_ONLY = /^var\(\s*(--[\w-]+)\s*\)$/;

type Declarations = Map<string, string>;

// Only rules at the top level or inside @layer count. Rules inside @media and
// similar are conditional overrides (for example reduced motion), not themes.
function isUnconditional(rule: Rule): boolean {
  for (
    let node = rule.parent;
    node && node.type !== "root";
    node = node.parent
  ) {
    if (node.type !== "atrule" || (node as postcss.AtRule).name !== "layer") {
      return false;
    }
  }
  return true;
}

function themeOf(selector: string): string | null {
  const match = DATA_THEME.exec(selector);
  if (match?.[2] !== undefined) return match[2];
  return selector.trim() === ":root" ? DEFAULT_THEME : null;
}

export function collectThemes(
  css: string,
  from?: string,
): Map<string, Declarations> {
  const themes = new Map<string, Declarations>([[DEFAULT_THEME, new Map()]]);
  postcss.parse(css, from === undefined ? {} : { from }).walkRules((rule) => {
    if (!isUnconditional(rule)) return;
    for (const selector of rule.selectors) {
      const theme = themeOf(selector);
      if (theme === null) continue;
      let declarations = themes.get(theme);
      if (!declarations) {
        declarations = new Map();
        themes.set(theme, declarations);
      }
      rule.walkDecls(/^--/, (decl) => {
        declarations.set(decl.prop, decl.value.trim());
      });
    }
  });
  return themes;
}

function resolve(
  name: string,
  theme: Declarations,
  root: Declarations,
): { value: string } | { error: string } {
  const seen: string[] = [];
  let current = name;
  for (;;) {
    if (seen.includes(current)) {
      return {
        error: `circular reference: ${[...seen, current].join(" -> ")}`,
      };
    }
    seen.push(current);
    const value = theme.get(current) ?? root.get(current);
    if (value === undefined) return { error: `${current} is not defined` };
    const reference = VAR_ONLY.exec(value)?.[1];
    if (reference === undefined) {
      return isHex(value)
        ? { value: value.toLowerCase() }
        : {
            error: `${current} resolves to "${value}", not an opaque 6-digit hex color`,
          };
    }
    current = reference;
  }
}

export function checkContrast(
  themes: Map<string, Declarations>,
  pairs: readonly ContrastPair[],
): PairResult[] {
  const root = themes.get(DEFAULT_THEME) ?? new Map<string, string>();
  const results: PairResult[] = [];
  for (const [theme, declarations] of themes) {
    for (const pair of pairs) {
      const fg = resolve(pair.foreground, declarations, root);
      const bg = resolve(pair.background, declarations, root);
      if ("error" in fg || "error" in bg) {
        const error = "error" in fg ? fg.error : "error" in bg ? bg.error : "";
        results.push({ ...pair, theme, ratio: null, error, pass: false });
        continue;
      }
      const ratio = contrastRatio(fg.value, bg.value);
      results.push({
        ...pair,
        theme,
        ratio,
        error: null,
        pass: ratio >= pair.min,
      });
    }
  }
  return results;
}

function isPair(value: unknown): value is ContrastPair {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.foreground === "string" &&
    typeof v.background === "string" &&
    typeof v.min === "number" &&
    typeof v.use === "string"
  );
}

export function loadPairs(path: string | URL): ContrastPair[] {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isPair)) {
    throw new TypeError(
      `${String(path)} must be an array of { foreground, background, min, use }`,
    );
  }
  return parsed;
}

function formatTable(results: readonly PairResult[]): string {
  const header = [
    "Theme",
    "Foreground",
    "Background",
    "Ratio",
    "Min",
    "Result",
  ];
  const rows = results.map((r) => [
    r.theme,
    r.foreground,
    r.background,
    r.ratio === null ? "-" : r.ratio.toFixed(2),
    r.min.toFixed(1),
    r.pass ? "pass" : `FAIL${r.error === null ? "" : ` (${r.error})`}`,
  ]);
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i]?.length ?? 0)),
  );
  const line = (cells: readonly string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i] ?? 0))
      .join("  ")
      .trimEnd();
  return [
    line(header),
    line(widths.map((w) => "-".repeat(w))),
    ...rows.map(line),
  ].join("\n");
}

if (import.meta.main) {
  const cssPath =
    process.argv[2] ?? fileURLToPath(new URL("../tokens.css", import.meta.url));
  const pairs = loadPairs(new URL("../contrast-pairs.json", import.meta.url));
  const results = checkContrast(
    collectThemes(readFileSync(cssPath, "utf8"), cssPath),
    pairs,
  );
  console.log(formatTable(results));
  const failures = results.filter((r) => !r.pass).length;
  if (failures > 0) {
    console.error(
      `\n${String(failures)} of ${String(results.length)} pairs failed in ${cssPath}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${String(results.length)} pairs pass in ${cssPath}`);
  }
}
