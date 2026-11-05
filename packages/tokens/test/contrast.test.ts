import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contrastRatio,
  isHex,
  relativeLuminance,
} from "../scripts/contrast.ts";

const close = (actual: number, expected: number, digits = 2) => {
  assert.equal(actual.toFixed(digits), expected.toFixed(digits));
};

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    assert.equal(relativeLuminance("#000000"), 0);
    assert.equal(relativeLuminance("#ffffff"), 1);
  });

  it("weights green over red over blue", () => {
    close(relativeLuminance("#ff0000"), 0.2126, 4);
    close(relativeLuminance("#00ff00"), 0.7152, 4);
    close(relativeLuminance("#0000ff"), 0.0722, 4);
  });

  it("is case insensitive", () => {
    assert.equal(relativeLuminance("#AbCdEf"), relativeLuminance("#abcdef"));
  });

  it("rejects anything but 6-digit hex", () => {
    for (const value of [
      "#fff",
      "#ffffffff",
      "ffffff",
      "rgb(0 0 0)",
      "#gggggg",
    ]) {
      assert.throws(() => relativeLuminance(value), TypeError, value);
    }
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  });

  it("is 1:1 for a color on itself", () => {
    assert.equal(contrastRatio("#3b76f6", "#3b76f6"), 1);
  });

  it("does not depend on argument order", () => {
    assert.equal(
      contrastRatio("#2559e0", "#fcfcfd"),
      contrastRatio("#fcfcfd", "#2559e0"),
    );
  });

  it("matches known reference values", () => {
    // #767676 is the lightest gray that passes 4.5:1 on white.
    close(contrastRatio("#767676", "#ffffff"), 4.54);
    close(contrastRatio("#777777", "#ffffff"), 4.48);
    close(contrastRatio("#ff0000", "#ffffff"), 4);
    close(contrastRatio("#0000ff", "#ffffff"), 8.59);
  });
});

describe("isHex", () => {
  it("accepts only opaque 6-digit hex", () => {
    assert.equal(isHex("#a1B2c3"), true);
    assert.equal(isHex("#abc"), false);
    assert.equal(isHex("#a1b2c3ff"), false);
  });
});
