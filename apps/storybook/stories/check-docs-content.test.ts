/// <reference types="vite/client" />
// Every component's docs page has Keyboard and ARIA content, so none shows
// "Not documented yet". Non-interactive components set `keyboard: []`.
import type { Meta } from "@storybook/react-vite";
import { expect, test } from "vitest";
import type { KheeDocsParameters } from "../.storybook/khee-docs.ts";

const metas = import.meta.glob<Meta>("./*.stories.tsx", {
  eager: true,
  import: "default",
});

test("finds the story files", () => {
  expect(Object.keys(metas)).not.toHaveLength(0);
});

test.each(Object.entries(metas))(
  "%s has keyboard and aria docs",
  (_path, meta) => {
    const { kheeDocs } = (meta.parameters ?? {}) as KheeDocsParameters;
    expect(kheeDocs?.keyboard, "kheeDocs.keyboard is missing").toBeDefined();
    expect(kheeDocs?.aria, "kheeDocs.aria is missing").toBeDefined();
    expect(kheeDocs?.aria, "kheeDocs.aria is empty").not.toHaveLength(0);
  },
);
