import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

import type { OperationResult, OutputFormat, WrittenFile } from "../types.js";
import { EXTENSION, slugify } from "../format.js";
import { extractInitials } from "./initials.js";
import { pickTextColor } from "./color.js";
import { angleFor, paletteByName, paletteFor } from "./palette.js";
import { buildAvatarSvg, type AvatarShape } from "./svg.js";
import { FONT_FAMILY, interFontPath, type FontWeight } from "./fonts.js";

export interface AvatarOptions {
  /** The name the avatar represents. Drives the initials and the gradient. */
  name: string;
  /** Explicit initials, bypassing the extraction rules. */
  initials?: string;
  maxInitials?: number;
  sizes?: number[];
  formats?: OutputFormat[];
  shape?: AvatarShape;
  /** Corner radius as a fraction of size, for the "rounded" shape. */
  radius?: number;
  outDir: string;
  /** Base filename; defaults to a slug of the name. */
  baseName?: string;
  weight?: FontWeight;
  /** Force a named palette instead of deriving one from the name. */
  palette?: string;
  /** Explicit gradient stops, overriding the palette entirely. */
  colors?: [string, string];
  /** Gradient angle in degrees; derived from the name when omitted. */
  angle?: number;
  /** Matte for formats without alpha. */
  background?: string;
}



async function encode(
  png: Buffer,
  format: OutputFormat,
  background: string,
): Promise<Buffer> {
  if (format === "png") return png;
  const image = sharp(png);
  switch (format) {
    // JPEG has no alpha, so the shape's transparent corners need a matte.
    // Without this they composite to black.
    case "jpeg":
      return image.flatten({ background }).jpeg({ quality: 92 }).toBuffer();
    case "webp":
      return image.webp({ quality: 92 }).toBuffer();
    case "avif":
      return image.avif({ quality: 65 }).toBuffer();
    default:
      throw new Error(`Unsupported avatar format: ${format}`);
  }
}

/**
 * Render a gradient avatar from a name's initials.
 *
 * The gradient is a pure function of the name: same name, same colours, on
 * every machine and in every front door.
 */
export async function generateAvatar(
  options: AvatarOptions,
): Promise<OperationResult> {
  const {
    name,
    outDir,
    sizes = [512],
    formats = ["png"],
    shape = "circle",
    radius = 0.22,
    maxInitials = 2,
    weight = 600,
    background = "#FFFFFF",
  } = options;

  if (name.trim() === "" && !options.initials) {
    throw new Error("A name (or explicit initials) is required.");
  }

  const initials = options.initials?.trim().toUpperCase()
    ?? extractInitials(name, maxInitials);
  if (initials === "") {
    throw new Error(`Could not derive initials from "${name}".`);
  }

  const key = name.normalize("NFC").trim().toLowerCase();
  const palette = options.colors
    ? { name: "custom", stops: options.colors as readonly [string, string] }
    : options.palette
      ? paletteByName(options.palette)
      : paletteFor(key);
  const angle = options.angle ?? angleFor(key);
  const textColor = pickTextColor(palette.stops);
  const base = options.baseName ?? slugify(name);
  const fontFile = interFontPath(weight);

  await mkdir(outDir, { recursive: true });

  const files: WrittenFile[] = [];
  for (const size of sizes) {
    const svg = buildAvatarSvg({
      initials,
      size,
      stops: palette.stops,
      angle,
      shape,
      radius,
      textColor,
      fontFamily: FONT_FAMILY,
      fontWeight: weight,
    });

    // Rasterise once per size, then re-encode per format.
    const png = formats.some((f) => f !== "svg")
      ? Buffer.from(
          new Resvg(svg, {
            font: {
              fontFiles: [fontFile],
              defaultFontFamily: FONT_FAMILY,
              loadSystemFonts: false,
            },
          })
            .render()
            .asPng(),
        )
      : Buffer.alloc(0);

    for (const format of formats) {
      const target = path.join(outDir, `${base}-${size}.${EXTENSION[format]}`);
      const data =
        format === "svg"
          ? Buffer.from(svg, "utf8")
          : await encode(png, format, background);
      await writeFile(target, data);
      files.push({
        path: target,
        format,
        width: size,
        height: size,
        bytes: data.byteLength,
      });
    }
  }

  return { files };
}

export type { AvatarShape } from "./svg.js";
export type { FontWeight } from "./fonts.js";
export { extractInitials } from "./initials.js";
export { PALETTES, paletteByName } from "./palette.js";
