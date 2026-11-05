import { describe, expect, it } from "vitest";
import { composeClassName } from "./compose-class-name.js";

interface State {
  isActive: boolean;
}

const values = { isActive: true, defaultClassName: "react-aria-X" };

function resolve(className: ReturnType<typeof composeClassName<State>>) {
  return typeof className === "function" ? className(values) : className;
}

describe("composeClassName", () => {
  it("returns only the khee class when className is undefined", () => {
    expect(resolve(composeClassName<State>("khee-x", undefined))).toBe(
      "khee-x",
    );
  });

  it("returns only the khee class when className is empty", () => {
    expect(resolve(composeClassName<State>("khee-x", ""))).toBe("khee-x");
  });

  it("prepends the khee class to a string className", () => {
    expect(resolve(composeClassName<State>("khee-x", "app-x"))).toBe(
      "khee-x app-x",
    );
  });

  it("prepends the khee class to a function className's result", () => {
    const className = composeClassName<State>(
      "khee-x",
      ({ isActive, defaultClassName }) =>
        isActive ? `app-active ${String(defaultClassName)}` : "app-idle",
    );
    expect(resolve(className)).toBe("khee-x app-active react-aria-X");
  });

  it("drops React Aria's default class", () => {
    expect(resolve(composeClassName<State>("khee-x", undefined))).not.toMatch(
      /react-aria/,
    );
  });
});
