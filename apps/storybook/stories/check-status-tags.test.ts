// Every component's meta carries exactly one status tag, which the docs page
// badge reads. Runs against the static build, so it sees the tags Storybook
// actually resolved.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { STATUS_TAGS } from "../.storybook/khee-docs.ts";

interface IndexEntry {
  type: "story" | "docs";
  title: string;
  tags?: string[];
}

const indexUrl = new URL("../storybook-static/index.json", import.meta.url);
const { entries } = JSON.parse(readFileSync(indexUrl, "utf8")) as {
  entries: Record<string, IndexEntry>;
};

test("every component has exactly one status tag", () => {
  const problems = Object.values(entries).flatMap(({ title, tags = [] }) => {
    const found = STATUS_TAGS.filter((status) => tags.includes(status));
    return found.length === 1
      ? []
      : [`${title}: ${found.length ? found.join(" and ") : "no status tag"}`];
  });

  assert.deepEqual(
    [...new Set(problems)],
    [],
    `Tag each component's meta with one of: ${STATUS_TAGS.join(", ")}`,
  );
});
