import { Command } from "commander";
import {
  cropImage,
  type CropPosition,
  type CropStrategy,
  type RasterFormat,
} from "@workbench/core";

import { emit, fail } from "../output.js";
import { number, oneOf } from "../parse.js";

const POSITIONS = [
  "center", "top", "bottom", "left", "right",
  "top-left", "top-right", "bottom-left", "bottom-right",
  "attention", "entropy",
] as const;
const STRATEGIES = ["crop", "pad"] as const;
const FORMATS = ["png", "webp", "jpeg", "avif"] as const;

export function registerCrop(program: Command): void {
  program
    .command("crop")
    .description("Crop or pad images to a target aspect ratio")
    .argument("<inputs...>", "image files to process")
    .requiredOption("-r, --ratio <ratio>", "target ratio, e.g. 1:1, 16:9, 4:3")
    .option("-o, --out <dir>", "output directory", ".")
    .option("-p, --position <pos>", `one of: ${POSITIONS.join(", ")}`, "center")
    .option("--strategy <strategy>", `one of: ${STRATEGIES.join(", ")}`, "crop")
    .option("-w, --width <px>", "output width; height follows the ratio")
    .option("-f, --format <fmt>", `one of: ${FORMATS.join(", ")} (default: keep input)`)
    .option("--background <hex>", "matte for padding and alpha-less formats", "#FFFFFF")
    .option("-q, --quality <n>", "encoder quality, 1-100", "90")
    .option("--allow-upscale", "permit enlarging beyond the source", false)
    .option("--keep-metadata", "preserve EXIF, including GPS coordinates", false)
    .option("--json", "emit machine-readable output", false)
    .action(async (inputs: string[], opts) => {
      const json = Boolean(opts.json);
      try {
        const result = await cropImage({
          inputs,
          ratio: opts.ratio,
          outDir: opts.out,
          position: oneOf<CropPosition>(opts.position, POSITIONS, "--position"),
          strategy: oneOf<CropStrategy>(opts.strategy, STRATEGIES, "--strategy"),
          width: opts.width === undefined ? undefined : number(opts.width, "--width"),
          format: opts.format
            ? oneOf<RasterFormat>(opts.format, FORMATS, "--format")
            : undefined,
          background: opts.background,
          quality: number(opts.quality, "--quality"),
          allowUpscale: Boolean(opts.allowUpscale),
          keepMetadata: Boolean(opts.keepMetadata),
        });
        emit(result, json);
      } catch (error) {
        fail(error, json);
      }
    });
}
