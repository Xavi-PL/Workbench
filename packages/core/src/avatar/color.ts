export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: "${hex}"`);
  }
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** Average of the stops — stands in for the colour sitting behind the text. */
export function mixHex(stops: readonly string[]): string {
  const rgbs = stops.map(parseHex);
  const avg = (key: keyof Rgb) =>
    rgbs.reduce((sum, c) => sum + c[key], 0) / rgbs.length;
  return toHex({ r: avg("r"), g: avg("g"), b: avg("b") });
}

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.1 contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT_INK = "#FFFFFF";
const DARK_INK = "#1A1A1A";

/** WCAG AA for large text. Avatar initials are always well above 18pt. */
const AA_LARGE = 3;

/**
 * Choose the ink colour.
 *
 * White is the convention for avatars and is what makes a directory of them
 * look like a set, so it wins whenever it clears the large-text contrast
 * floor against the gradient's midpoint. Only genuinely pale gradients
 * (amber, lime) fall through to dark ink.
 *
 * Maximising contrast instead would be defensible but puts dark ink on
 * mid-tone blues and greens, which reads as a rendering bug.
 *
 * The midpoint matters rather than either stop: a gradient running from pale
 * amber to deep orange is legible against one end and not the other.
 */
export function pickTextColor(stops: readonly string[]): string {
  const mid = mixHex(stops);
  return contrastRatio(mid, LIGHT_INK) >= AA_LARGE ? LIGHT_INK : DARK_INK;
}
