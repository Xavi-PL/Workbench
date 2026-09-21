import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Sharp } from "sharp";

import type { OperationResult, RasterFormat, WrittenFile } from "../types.js";
import { EXTENSION, baseNameOf, formatFromPath } from "../format.js";
import { parseRatio, ratioValue, type Ratio } from "./ratio.js";

/** Where the crop window sits, or how sharp should choose it. */
export type CropPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "attention"
  | "entropy";

export type CropStrategy = "crop" | "pad";

export interface CropOptions {
  inputs: string[];
  ratio: string;
  outDir: string;
  position?: CropPosition;
  strategy?: CropStrategy;
  /** Output width; the height follows from the ratio. */
  width?: number;
  format?: RasterFormat;
  /** Matte for "pad", and for alpha-less output formats. */
  background?: string;
  quality?: number;
  /** Enlarging a crop past its source only invents pixels. Off by default. */
  allowUpscale?: boolean;
  /** EXIF is stripped by default, which also drops GPS coordinates. */
  keepMetadata?: boolean;
}

const SHARP_POSITION: Record<Exclude<CropPosition, "attention" | "entropy">, string> = {
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

function resolvePosition(position: CropPosition): string | number {
  if (position === "attention") return sharp.strategy.attention;
  if (position === "entropy") return sharp.strategy.entropy;
  return SHARP_POSITION[position];
}

/**
 * Dimensions as the image will actually be rendered, once EXIF orientation is
 * applied.
 *
 * sharp's metadata() always reports the dimensions as *stored*, even on a
 * pipeline with rotate() or autoOrient() already applied - verified against
 * sharp 0.35.4. EXIF orientations 5-8 are the quarter turns, which swap the
 * axes, and a portrait phone photo is very often stored landscape with
 * orientation 6. Sizing a crop window from the stored dimensions therefore
 * crops the wrong axis entirely.
 */
export function orientedSize(meta: {
  width?: number | undefined;
  height?: number | undefined;
  orientation?: number | undefined;
}): { width: number; height: number } | undefined {
  if (!meta.width || !meta.height) return undefined;
  const quarterTurned = (meta.orientation ?? 1) >= 5;
  return quarterTurned
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height };
}

/**
 * Largest box of the target ratio that fits the source.
 *
 * "crop" takes the biggest window of that shape from inside the image, losing
 * the overflow. "pad" keeps the whole image and grows the other axis, so
 * nothing is lost and the gap is filled with the background colour.
 */
export function targetBox(
  source: { width: number; height: number },
  ratio: Ratio,
  strategy: CropStrategy,
): { width: number; height: number } {
  const target = ratioValue(ratio);
  const current = source.width / source.height;
  const widthLed = strategy === "crop" ? current > target : current < target;

  return widthLed
    ? { width: Math.round(source.height * target), height: source.height }
    : { width: source.width, height: Math.round(source.width / target) };
}

async function encode(
  pipeline: Sharp,
  format: RasterFormat,
  background: string,
  quality: number,
): Promise<Buffer> {
  switch (format) {
    case "jpeg":
      return pipeline.flatten({ background }).jpeg({ quality, mozjpeg: true }).toBuffer();
    case "png":
      return pipeline.png().toBuffer();
    case "webp":
      return pipeline.webp({ quality }).toBuffer();
    case "avif":
      return pipeline.avif({ quality }).toBuffer();
  }
}

/** Crop or pad images to a target aspect ratio. */
export async function cropImage(options: CropOptions): Promise<OperationResult> {
  const {
    inputs,
    outDir,
    position = "center",
    strategy = "crop",
    background = "#FFFFFF",
    quality = 90,
    allowUpscale = false,
    keepMetadata = false,
  } = options;

  if (inputs.length === 0) throw new Error("At least one input image is required.");
  const ratio = parseRatio(options.ratio);
  await mkdir(outDir, { recursive: true });

  const files: WrittenFile[] = [];
  for (const input of inputs) {
    // autoOrient applies the EXIF orientation to the pixels; orientedSize
    // works out what those pixels will measure, which metadata() will not say.
    const pipeline = sharp(input).autoOrient();
    const source = orientedSize(await sharp(input).metadata());
    if (!source) {
      throw new Error(`Could not read dimensions from "${input}".`);
    }

    const box = targetBox(source, ratio, strategy);
    let { width, height } = box;

    if (options.width !== undefined) {
      width = options.width;
      height = Math.round(options.width / ratioValue(ratio));
      if (!allowUpscale && width > box.width) {
        width = box.width;
        height = box.height;
      }
    }

    const format =
      options.format ?? formatFromPath(input) ?? "png";

    let work = pipeline.resize({
      width,
      height,
      fit: strategy === "crop" ? "cover" : "contain",
      position: resolvePosition(position) as never,
      background,
      withoutEnlargement: !allowUpscale,
    });
    if (keepMetadata) work = work.withMetadata();

    const data = await encode(work, format, background, quality);
    const target = path.join(
      outDir,
      `${baseNameOf(input)}-${ratio.slug}.${EXTENSION[format]}`,
    );
    await writeFile(target, data);

    const written = await sharp(data).metadata();
    files.push({
      path: target,
      format,
      width: written.width ?? width,
      height: written.height ?? height,
      bytes: data.byteLength,
    });
  }

  return { files };
}

export { parseRatio, ratioValue } from "./ratio.js";
export type { Ratio } from "./ratio.js";
