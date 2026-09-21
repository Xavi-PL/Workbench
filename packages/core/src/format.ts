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
