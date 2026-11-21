import { describe, expect, it } from "vitest";
import { joinClassNames } from "./join-class-names.js";

describe("joinClassNames", () => {
  it("returns only the khee class when className is undefined", () => {
    expect(joinClassNames("khee-x", undefined)).toBe("khee-x");
  });

  it("returns only the khee class when className is empty", () => {
    expect(joinClassNames("khee-x", "")).toBe("khee-x");
  });

  it("appends a consumer className after the khee class", () => {
    expect(joinClassNames("khee-x", "app-x app-y")).toBe("khee-x app-x app-y");
  });
});
