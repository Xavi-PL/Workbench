import type { Sharp } from "sharp";

import type { RasterFormat } from "./types.js";

export interface EncodeOptions {
  format: RasterFormat;
  /** 1-100. Ignored by png, which is lossless. */
  quality?: number;
  /** Matte applied to formats without an alpha channel. */
  background?: string;
  /** webp and avif only. */
  lossless?: boolean;
  /** Encoder effort; higher is slower and smaller. Format-specific range. */
  effort?: number;
  /**
   * Quantise png to a palette. Lossy, often a large saving on flat graphics,
   * and wrong as a default: a crop or a convert should not quietly degrade a
   * lossless source. compress-image opts in deliberately.
   */
  palette?: boolean;
}

/**
 * Encode a pipeline to a raster format.
 *
 * JPEG has no alpha channel: without an explicit flatten, transparent pixels
 * composite to black rather than to anything sensible, so a matte is always
 * applied for it.
 */
export async function encodeImage(
  pipeline: Sharp,
  options: EncodeOptions,
): Promise<Buffer> {
  const { format, quality = 90, background = "#FFFFFF", lossless, effort } = options;

  switch (format) {
    case "jpeg":
      return pipeline
        .flatten({ background })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    case "png":
      return pipeline
        .png({
          compressionLevel: effort ?? 6,
          palette: options.palette ?? false,
          ...(options.palette ? { quality } : {}),
        })
        .toBuffer();
    case "webp":
      return pipeline
        .webp({ quality, lossless: lossless ?? false, effort: effort ?? 4 })
        .toBuffer();
    case "avif":
      return pipeline
        .avif({ quality, lossless: lossless ?? false, effort: effort ?? 4 })
        .toBuffer();
  }
}
