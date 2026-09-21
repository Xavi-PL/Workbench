export interface Ratio {
  width: number;
  height: number;
  /** Filename-safe form, e.g. "16x9". */
  slug: string;
}

/**
 * Parse an aspect ratio. Accepts "16:9", "16x9" and "1.7778"; the separator
 * forms are preferred because they survive a filename unambiguously.
 */
export function parseRatio(input: string): Ratio {
  const text = input.trim().toLowerCase();

  const pair = /^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/.exec(text);
  if (pair) {
    const width = Number(pair[1]);
    const height = Number(pair[2]);
    if (width > 0 && height > 0) {
      return { width, height, slug: `${trim(width)}x${trim(height)}` };
    }
  }

  const decimal = Number(text);
  if (Number.isFinite(decimal) && decimal > 0) {
    return { width: decimal, height: 1, slug: trim(decimal).replace(".", "-") };
  }

  throw new Error(`Not an aspect ratio: "${input}". Try 1:1, 16:9 or 4:3.`);
}

function trim(value: number): string {
  return String(Number(value.toFixed(4)));
}

export function ratioValue(ratio: Ratio): number {
  return ratio.width / ratio.height;
}
