/** Raster formats the toolchain can write. */
export type RasterFormat = "png" | "jpeg" | "webp" | "avif";

/**
 * Formats accepted as input. SVG is input-only: rasterising is one-way, and
 * raster -> svg is a tracing problem that is deliberately out of scope.
 */
export type InputFormat = RasterFormat | "svg";

/** A file written to disk. Every core operation reports what it produced. */
export interface WrittenFile {
  path: string;
  format: RasterFormat;
  width: number;
  height: number;
  bytes: number;
}

/**
 * The shape every core operation returns, so the CLI can emit it verbatim
 * under --json and agents never have to scrape stdout.
 */
export interface OperationResult {
  files: WrittenFile[];
}
