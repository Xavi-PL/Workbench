import { Command } from "commander";
import { compressImage, type RasterFormat } from "@workbench/core";

import { emit, fail } from "../output.js";
import { bytes, number, oneOf } from "../parse.js";

const FORMATS = ["png", "webp", "jpeg", "avif"] as const;

export function registerCompress(program: Command): void {
  program
    .command("compress")
    .description("Re-encode images smaller, by quality or to a size budget")
    .argument("<inputs...>", "image files to process")
    .option("-o, --out <dir>", "output directory", ".")
    .option("-q, --quality <n>", "1-100; higher means larger and better", "80")
    .option("-m, --max-size <size>", "size budget per file, e.g. 200kb")
    .option("-f, --format <fmt>", `one of: ${FORMATS.join(", ")} (default: keep input)`)
    .option("-w, --width <px>", "also resize down to this width")
    .option("--background <hex>", "matte for alpha-less formats", "#FFFFFF")
    .option("--effort <n>", "encoder effort; higher is slower and smaller")
    .option("--no-palette", "keep png truecolour instead of quantising")
    .option("--allow-larger", "write the result even if it beats nothing", false)
    .option("--keep-metadata", "preserve EXIF, including GPS coordinates", false)
    .option("--json", "emit machine-readable output", false)
    .action(async (inputs: string[], opts) => {
      const json = Boolean(opts.json);
      try {
        const result = await compressImage({
          inputs,
          outDir: opts.out,
          quality: number(opts.quality, "--quality"),
          maxBytes:
            opts.maxSize === undefined ? undefined : bytes(opts.maxSize, "--max-size"),
          format: opts.format
            ? oneOf<RasterFormat>(opts.format, FORMATS, "--format")
            : undefined,
          width: opts.width === undefined ? undefined : number(opts.width, "--width"),
          background: opts.background,
          effort: opts.effort === undefined ? undefined : number(opts.effort, "--effort"),
          // commander maps --no-palette to palette:false, defaulting to true
          palette: opts.palette === false ? false : undefined,
          allowLarger: Boolean(opts.allowLarger),
          keepMetadata: Boolean(opts.keepMetadata),
        });
        emit(result, json);
      } catch (error) {
        fail(error, json);
      }
    });
}
