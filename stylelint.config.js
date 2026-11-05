// @ts-check
// Shared by every package, so component CSS gets the same rules as tokens.css.

/** @type {import("stylelint").Config} */
export default {
  plugins: ["./packages/tokens/stylelint/plugin.js"],
  ignoreFiles: ["**/dist/**", "**/node_modules/**", "**/test/fixtures/**"],
  rules: {
    // Everything Khee defines is prefixed (ADR 0002).
    "custom-property-pattern": [
      "^khee-",
      {
        message: (name) =>
          `Expected custom property "${name}" to start with "--khee-"`,
      },
    ],
    "selector-class-pattern": [
      "^khee-",
      { message: (name) => `Expected class "${name}" to start with ".khee-"` },
    ],

    // Logical properties only, so RTL works by default.
    "property-disallowed-list": [
      [
        "left",
        "right",
        "margin-left",
        "margin-right",
        "padding-left",
        "padding-right",
        "/^border-(left|right)/",
        "/^border-(top|bottom)-(left|right)-radius$/",
        "/^scroll-(margin|padding)-(left|right)$/",
      ],
    ],
    "declaration-property-value-disallowed-list": [
      {
        float: ["left", "right"],
        clear: ["left", "right"],
        "text-align": ["left", "right"],
      },
    ],

    // Token contract (ADR 0003).
    "khee/no-unknown-token": true,
    "khee/no-palette-outside-tokens": true,
  },
};
