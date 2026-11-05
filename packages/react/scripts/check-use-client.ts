// Fails if an emitted file for an interactive component does not start with
// the "use client" directive, which Next.js App Router needs (ADR 0007).
//
// A file is interactive if it imports from react-aria-components or imports
// any use* binding from react.
//
// Usage: node scripts/check-use-client.ts [dir]   (defaults to dist/)
import { glob, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const HOOK_NAME = /^use[A-Z0-9]/;

function importsHookFromReact(node: ts.ImportDeclaration): boolean {
  const bindings = node.importClause?.namedBindings;
  if (bindings === undefined || !ts.isNamedImports(bindings)) return false;
  return bindings.elements.some((element) =>
    HOOK_NAME.test((element.propertyName ?? element.name).text),
  );
}

export function isInteractive(sourceFile: ts.SourceFile): boolean {
  return sourceFile.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement)) return false;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) return false;
    const from = statement.moduleSpecifier.text;
    if (from === "react-aria-components") return true;
    return from === "react" && importsHookFromReact(statement);
  });
}

export function startsWithUseClient(sourceFile: ts.SourceFile): boolean {
  const [first] = sourceFile.statements;
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use client"
  );
}

/** Returns true if the file is fine: not interactive, or starting with the directive. */
export function checkSource(fileName: string, text: string): boolean {
  const sourceFile = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  return !isInteractive(sourceFile) || startsWithUseClient(sourceFile);
}

/** Returns the paths, relative to `dir`, of interactive files missing the directive. */
export async function findOffenders(dir: string): Promise<string[]> {
  const offenders: string[] = [];
  for await (const file of glob("**/*.js", { cwd: dir })) {
    const path = join(dir, file);
    if (!checkSource(path, await readFile(path, "utf8"))) offenders.push(file);
  }
  return offenders.sort();
}

if (import.meta.main) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const dir = process.argv[2] ?? join(root, "dist");
  const offenders = await findOffenders(dir);
  if (offenders.length > 0) {
    console.error(
      `These interactive files must start with "use client":\n${offenders
        .map((file) => `  ${relative(process.cwd(), join(dir, file))}`)
        .join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `"use client" check passed for ${relative(process.cwd(), dir) || "."}`,
  );
}
