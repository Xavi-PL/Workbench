import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import type { OperationResult, RasterFormat, WrittenFile } from "../types.js";
import { EXTENSION, assertUniqueTargets, baseNameOf, formatFromPath } from "../format.js";
import { encodeImage } from "../encode.js";

export interface CompressedFile extends WrittenFile {
  /** Size of the input, for reporting the saving. */
  sourceBytes: number;
  /** The quality actually used, which target mode may have chosen. */
  quality: number;
  /** The encoder could not beat the source, so the original was kept. */
  keptOriginal: boolean;
  /** Target mode ran out of headroom before reaching maxBytes. */
  missedTarget: boolean;
}

export interface CompressResult extends OperationResult {
  files: CompressedFile[];
}

export interface CompressOptions {
  inputs: string[];
  outDir: string;
  /** 1-100. Higher means better quality and a larger file. */
  quality?: number;
  /** Search for the highest quality that fits this budget, in bytes. */
  maxBytes?: number;
  /** Defaults to the input's own format. */
  format?: RasterFormat;
  background?: string;
  effort?: number;
  /**
   * Quantise png to a palette. On by default here, unlike elsewhere: a
   * lossless png re-encode saves almost nothing, and this tool exists to make
   * files smaller.
   */
  palette?: boolean;
  keepMetadata?: boolean;
  /** Write the re-encoded file even when it is larger than the source. */
  allowLarger?: boolean;
  width?: number;
}

/** Quality floor for target search. Below this, artefacts dominate. */
const MIN_QUALITY = 10;
const MAX_QUALITY = 100;

/**
 * Highest quality whose encode fits `maxBytes`.
 *
 * Size is monotonic in quality for every encoder here, so a binary search is
 * safe and lands in about seven encodes rather than a linear sweep.
 */
export async function searchQuality(
  encode: (quality: number) => Promise<Buffer>,
  maxBytes: number,
): Promise<{ quality: number; data: Buffer; missedTarget: boolean }> {
  const best = await encode(MAX_QUALITY);
  if (best.byteLength <= maxBytes) {
    return { quality: MAX_QUALITY, data: best, missedTarget: false };
  }

  const floor = await encode(MIN_QUALITY);
  if (floor.byteLength > maxBytes) {
    // Even the floor overshoots: return it and say so rather than pretending.
    return { quality: MIN_QUALITY, data: floor, missedTarget: true };
  }

  let low = MIN_QUALITY;
  let high = MAX_QUALITY;
  let chosen = { quality: MIN_QUALITY, data: floor };

  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    const data = await encode(mid);
    if (data.byteLength <= maxBytes) {
      chosen = { quality: mid, data };
      low = mid;
    } else {
      high = mid;
    }
  }

  return { ...chosen, missedTarget: false };
}

/** Re-encode images smaller, by a quality knob or to a size budget. */
export async function compressImage(
  options: CompressOptions,
): Promise<CompressResult> {
  const {
    inputs,
    outDir,
    quality = 80,
    maxBytes,
    background = "#FFFFFF",
    effort,
    keepMetadata = false,
    allowLarger = false,
    width,
  } = options;

  if (inputs.length === 0) {
    throw new Error("At least one input image is required.");
  }
  if (maxBytes !== undefined && maxBytes <= 0) {
    throw new Error("A size budget must be a positive number of bytes.");
  }
  await mkdir(outDir, { recursive: true });

  const resolved = inputs.map((input) => {
    const format = options.format ?? formatFromPath(input) ?? "png";
    return {
      input,
      format,
      target: path.join(outDir, `${baseNameOf(input)}.${EXTENSION[format]}`),
    };
  });
  assertUniqueTargets(resolved);

  const files: CompressedFile[] = [];
  for (const { input, format, target } of resolved) {
    if (path.resolve(target) === path.resolve(input)) {
      throw new Error(
        `Refusing to overwrite the source: "${input}". Use --out to write elsewhere.`,
      );
    }

    const sourceBytes = (await stat(input)).size;
    const build = () => {
      let pipeline = sharp(input).autoOrient();
      if (width !== undefined) {
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
      }
      if (keepMetadata) pipeline = pipeline.withMetadata();
      return pipeline;
    };

    const encodeAt = (q: number) =>
      encodeImage(build(), {
        format,
        quality: q,
        background,
        effort,
        palette: options.palette ?? format === "png",
      });

    let used = quality;
    let missedTarget = false;
    let data: Buffer;

    if (maxBytes === undefined) {
      data = await encodeAt(quality);
    } else {
      const found = await searchQuality(encodeAt, maxBytes);
      data = found.data;
      used = found.quality;
      missedTarget = found.missedTarget;
    }

    // Re-encoding can inflate an already well-optimised file. Shipping a
    // larger "compressed" image is never what was wanted, so the source is
    // copied through byte for byte instead.
    //
    // Only possible when the format is unchanged: a png asked to become webp
    // has no original bytes to fall back to, so it is written as encoded and
    // the caller can see bytes > sourceBytes in the result.
    const sameFormat = formatFromPath(input) === format;
    const keptOriginal =
      !allowLarger && sameFormat && data.byteLength >= sourceBytes;
    if (keptOriginal) {
      data = await readFile(input);
    }

    await writeFile(target, data);
    const written = await sharp(data).metadata();
    files.push({
      path: target,
      format,
      width: written.width ?? 0,
      height: written.height ?? 0,
      bytes: data.byteLength,
      sourceBytes,
      quality: used,
      keptOriginal,
      missedTarget,
    });
  }

  return { files };
}
