export type AvatarShape = "circle" | "rounded" | "square";

export interface AvatarSvgOptions {
  initials: string;
  size: number;
  stops: readonly [string, string];
  angle: number;
  shape: AvatarShape;
  /** Corner radius as a fraction of size, used by the "rounded" shape. */
  radius: number;
  textColor: string;
  fontFamily: string;
  fontWeight: number;
}

/** Font size as a fraction of the avatar, backed off as initials get longer. */
function fontScale(initialCount: number): number {
  if (initialCount <= 1) return 0.46;
  if (initialCount === 2) return 0.38;
  return 0.3;
}

/**
 * Gradient vector for `angle`, in objectBoundingBox units.
 * 0deg runs left to right, increasing clockwise.
 */
function gradientVector(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) / 2;
  const dy = Math.sin(rad) / 2;
  return {
    x1: round(0.5 - dx),
    y1: round(0.5 - dy),
    x2: round(0.5 + dx),
    y2: round(0.5 + dy),
  };
}

function round(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shapeElement(shape: AvatarShape, size: number, radius: number): string {
  if (shape === "circle") {
    const r = size / 2;
    return `<circle cx="${r}" cy="${r}" r="${r}" fill="url(#g)"/>`;
  }
  const rx = shape === "rounded" ? round(size * radius) : 0;
  return `<rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="url(#g)"/>`;
}

export function buildAvatarSvg(options: AvatarSvgOptions): string {
  const { initials, size, stops, angle, shape, radius, textColor } = options;
  const { x1, y1, x2, y2 } = gradientVector(angle);
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(initials)].length;
  const fontSize = round(size * fontScale(graphemes));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`,
    `<stop offset="0" stop-color="${stops[0]}"/>`,
    `<stop offset="1" stop-color="${stops[1]}"/>`,
    `</linearGradient></defs>`,
    shapeElement(shape, size, radius),
    `<text x="${size / 2}" y="${size / 2}" fill="${textColor}"`,
    ` font-family="${escapeXml(options.fontFamily)}" font-size="${fontSize}"`,
    ` font-weight="${options.fontWeight}" text-anchor="middle"`,
    ` dominant-baseline="central">${escapeXml(initials)}</text>`,
    `</svg>`,
  ].join("");
}
