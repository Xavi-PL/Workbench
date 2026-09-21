import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import type { OperationResult, RasterFormat, WrittenFile } from "../types.js";
import { EXTENSION, baseNameOf } from "../format.js";
import { encodeImage } from "../encode.js";

export interface ConvertOptions {
  inputs: string[];
  /** Target format. SVG is not a valid target: rasterising is one-way. */
  format: RasterFormat;
  outDir: string;
  quality?: number;
  /** Resize on the way out; the aspect ratio is preserved. */
  width?: number;
  background?: string;
  lossless?: boolean;
  keepMetadata?: boolean;
  /**
   * DPI used to rasterise SVG input; ignored for raster sources.
   *
   * Not needed to hit a target size. sharp passes `width` down to librsvg and
   * rasterises at the final resolution already - a plain .resize() and an
   * explicitly dense one differ by 0.0000 mean absolute pixel value. This is
   * for what sharp cannot infer: an SVG sized only in percentages, or scaling
   * one up without naming a width.
   */
  density?: number;
  allowUpscale?: boolean;
}

/** Convert images between raster formats, rasterising SVG input on the way. */
export async function convertImage(
  options: ConvertOptions,
): Promise<OperationResult> {
  const {
    inputs,
    format,
    outDir,
    quality = 90,
    background = "#FFFFFF",
    lossless = false,
    keepMetadata = false,
    allowUpscale = false,
    density,
  } = options;

  if (inputs.length === 0) {
    throw new Error("At least one input image is required.");
  }
  await mkdir(outDir, { recursive: true });

  const files: WrittenFile[] = [];
  for (const input of inputs) {
    let pipeline = sharp(
      input,
      density === undefined ? {} : { density },
    ).autoOrient();

    if (options.width !== undefined) {
      pipeline = pipeline.resize({
        width: options.width,
        withoutEnlargement: !allowUpscale,
      });
    }
    if (keepMetadata) pipeline = pipeline.withMetadata();

    const target = path.join(outDir, `${baseNameOf(input)}.${EXTENSION[format]}`);
    if (path.resolve(target) === path.resolve(input)) {
      throw new Error(
        `Refusing to overwrite the source: "${input}". Use --out to write elsewhere.`,
      );
    }

    const data = await encodeImage(pipeline, {
      format,
      quality,
      background,
      lossless,
    });
    await writeFile(target, data);

    const written = await sharp(data).metadata();
    files.push({
      path: target,
      format,
      width: written.width ?? 0,
      height: written.height ?? 0,
      bytes: data.byteLength,
    });
  }

  return { files };
}
