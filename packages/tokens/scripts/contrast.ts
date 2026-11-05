// WCAG 2.x contrast math for opaque 6-digit hex colors.
// https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value: string): boolean {
  return HEX.test(value);
}

function channel(hex: string, offset: number): number {
  const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  if (!isHex(hex)) {
    throw new TypeError(`Expected a 6-digit hex color, got "${hex}"`);
  }
  return (
    0.2126 * channel(hex, 1) +
    0.7152 * channel(hex, 3) +
    0.0722 * channel(hex, 5)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
