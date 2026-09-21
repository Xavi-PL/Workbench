import { Command } from "commander";
import { convertImage, type RasterFormat } from "@workbench/core";

import { emit, fail } from "../output.js";
import { number, oneOf } from "../parse.js";

const FORMATS = ["png", "webp", "jpeg", "avif"] as const;

export function registerConvert(program: Command): void {
  program
    .command("convert")
    .description("Convert images between formats; svg is accepted as input")
    .argument("<inputs...>", "image files to process")
    .requiredOption("-f, --format <fmt>", `target format: ${FORMATS.join(", ")}`)
    .option("-o, --out <dir>", "output directory", ".")
    .option("-q, --quality <n>", "encoder quality, 1-100", "90")
    .option("-w, --width <px>", "resize on the way out, preserving the ratio")
    .option("--background <hex>", "matte for alpha-less formats", "#FFFFFF")
    .option("--lossless", "webp and avif only", false)
    .option("--density <dpi>", "rasterisation DPI for svg input")
    .option("--allow-upscale", "permit enlarging beyond the source", false)
    .option("--keep-metadata", "preserve EXIF, including GPS coordinates", false)
    .option("--json", "emit machine-readable output", false)
    .action(async (inputs: string[], opts) => {
      const json = Boolean(opts.json);
      try {
        if (String(opts.format).toLowerCase() === "svg") {
          throw new Error(
            "SVG output is not supported. Rasterising is one-way; turning a " +
              "photo back into vectors is image tracing, which this tool does " +
              "not do. SVG is accepted as an input format.",
          );
        }
        const result = await convertImage({
          inputs,
          format: oneOf<RasterFormat>(opts.format, FORMATS, "--format"),
          outDir: opts.out,
          quality: number(opts.quality, "--quality"),
          width: opts.width === undefined ? undefined : number(opts.width, "--width"),
          background: opts.background,
          lossless: Boolean(opts.lossless),
          density:
            opts.density === undefined ? undefined : number(opts.density, "--density"),
          allowUpscale: Boolean(opts.allowUpscale),
          keepMetadata: Boolean(opts.keepMetadata),
        });
        emit(result, json);
      } catch (error) {
        fail(error, json);
      }
    });
}
