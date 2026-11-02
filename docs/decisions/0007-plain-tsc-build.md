# 0007. Plain `tsc` build with NodeNext resolution

- Status: Accepted
- Date: 2026-11-01

## Context

Library bundlers (tsup, Vite library mode, and similar) merge modules into chunks.
That has two costs for a React component library:

- Per-file `"use client"` directives can be dropped or misplaced when modules are merged, which breaks Next.js App Router consumers.
- Merged chunks weaken tree-shaking for apps that import one component.

Khee's components are thin, and CSS is copied as-is.
Nothing here needs a bundler.

## Decision

- Packages build with plain `tsc`: one emitted `.js` and `.d.ts` per source module.
- Published packages use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`, with explicit `.js` extensions on relative imports.
- Each `package.json` declares an explicit `exports` map, including the CSS entry points.
- `sideEffects` lists only CSS files.
- A CI check fails if any emitted `dist/` file for an interactive component does not start with `"use client"`.
- A private Next.js App Router app renders every interactive component from a server component.

## Consequences

- Emitted output mirrors the source tree, so it is easy to inspect and debug.
- `"use client"` survives by construction, and CI proves it.
- NodeNext output works in Node, bundlers, and type checkers without a bundler on our side.
- Authors must write `.js` extensions in relative imports. The compiler enforces this.
- No minification. Consuming apps minify their own bundles.
