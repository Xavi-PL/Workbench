import path from "node:path";

import type { OutputFormat, RasterFormat } from "./types.js";

export const EXTENSION: Record<OutputFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
  svg: "svg",
};

const BY_EXTENSION: Record<string, RasterFormat> = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  webp: "webp",
  avif: "avif",
};

/** Raster format implied by a file's extension, or undefined if unsupported. */
export function formatFromPath(file: string): RasterFormat | undefined {
  return BY_EXTENSION[path.extname(file).slice(1).toLowerCase()];
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "untitled" : slug;
}

/** Filename without its extension. */
export function baseNameOf(file: string): string {
  return path.basename(file, path.extname(file));
}

/**
 * Reject input sets whose outputs would land on the same path.
 *
 * Output names are derived from the input's basename, so `a/logo.png` and
 * `b/logo.png` in one batch both want `logo.webp` and the second silently
 * destroys the first. Failing up front beats writing a directory that is
 * quietly missing files.
 */
export function assertUniqueTargets(
  pairs: readonly { input: string; target: string }[],
): void {
  const seen = new Map<string, string>();
  for (const { input, target } of pairs) {
    const previous = seen.get(target);
    if (previous !== undefined) {
      throw new Error(
        `"${previous}" and "${input}" would both be written to "${target}". ` +
          "Rename one, or convert them in separate runs.",
      );
    }
    seen.set(target, input);
  }
}
