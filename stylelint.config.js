// @ts-check
// Shared by every package, so component CSS gets the same rules as tokens.css.

// Logical properties only, so RTL works by default.
const PHYSICAL_PROPERTIES = [
  "left",
  "right",
  "margin-left",
  "margin-right",
  "padding-left",
  "padding-right",
  "/^border-(left|right)/",
  "/^border-(top|bottom)-(left|right)-radius$/",
  "/^scroll-(margin|padding)-(left|right)$/",
];

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

    "property-disallowed-list": [PHYSICAL_PROPERTIES],
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

    // All library CSS lives in the khee cascade layer (ADR 0002).
    "khee/require-layer": true,
  },
  overrides: [
    {
      // Component CSS takes every design value from semantic tokens.
      // CSS system colors stay allowed for forced-colors styles.
      files: ["packages/react/**/*.css"],
      rules: {
        "color-no-hex": true,
        "color-named": "never",
        "function-disallowed-list": [
          [
            "rgb",
            "rgba",
            "hsl",
            "hsla",
            "hwb",
            "lab",
            "lch",
            "oklab",
            "oklch",
            "color",
          ],
        ],
        "unit-disallowed-list": [
          ["px", "rem", "em", "ms", "s"],
          {
            ignoreMediaFeatureNames: {
              px: ["/.*/"],
              rem: ["/.*/"],
              em: ["/.*/"],
            },
          },
        ],
        // No component tier (ADR 0003), so components declare no custom properties.
        "property-disallowed-list": [[...PHYSICAL_PROPERTIES, "/^--/"]],
      },
    },
  ],
};
