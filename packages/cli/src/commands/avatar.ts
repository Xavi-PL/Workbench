import { Command } from "commander";
import {
  generateAvatar,
  PALETTES,
  type AvatarShape,
  type FontWeight,
  type OutputFormat,
} from "@workbench/core";

import { emit, fail } from "../output.js";
import { integers, list, number, oneOf } from "../parse.js";

const FORMATS = ["png", "webp", "jpeg", "avif", "svg"] as const;
const SHAPES = ["circle", "rounded", "square"] as const;
const WEIGHTS = ["400", "500", "600", "700", "800"] as const;

export function registerAvatar(program: Command): void {
  program
    .command("avatar")
    .description("Gradient avatar from a name's initials, deterministic per name")
    .requiredOption("-n, --name <name>", "name the avatar represents")
    .option("-o, --out <dir>", "output directory", ".")
    .option("-s, --size <list>", "comma-separated pixel sizes", "512")
    .option("-f, --format <list>", `comma-separated: ${FORMATS.join(", ")}`, "png")
    .option("-i, --initials <text>", "override the derived initials")
    .option("--max-initials <n>", "how many initials to derive", "2")
    .option("--shape <shape>", `one of: ${SHAPES.join(", ")}`, "circle")
    .option("--radius <n>", "corner radius as a fraction of size", "0.22")
    .option("--weight <n>", `font weight: ${WEIGHTS.join(", ")}`, "600")
    .option("--palette <name>", "force a palette instead of deriving one")
    .option("--colors <from,to>", "explicit gradient stops, overriding the palette")
    .option("--angle <deg>", "gradient angle; derived from the name when omitted")
    .option("--background <hex>", "matte for formats without alpha", "#FFFFFF")
    .option("--list-palettes", "print the available palette names and exit")
    .option("--json", "emit machine-readable output", false)
    .action(async (opts) => {
      const json = Boolean(opts.json);
      try {
        if (opts.listPalettes) {
          for (const p of PALETTES) {
            process.stdout.write(`${p.name}  ${p.stops.join(" -> ")}\n`);
          }
          return;
        }

        const colors = opts.colors ? list(opts.colors) : undefined;
        if (colors && colors.length !== 2) {
          throw new Error("--colors expects exactly two stops, e.g. #FF0000,#0000FF");
        }

        const result = await generateAvatar({
          name: opts.name,
          outDir: opts.out,
          sizes: integers(opts.size, "--size"),
          formats: list(opts.format).map((f) =>
            oneOf<OutputFormat>(f, FORMATS, "--format"),
          ),
          initials: opts.initials,
          maxInitials: integers(opts.maxInitials, "--max-initials")[0],
          shape: oneOf<AvatarShape>(opts.shape, SHAPES, "--shape"),
          radius: number(opts.radius, "--radius"),
          weight: Number(oneOf(opts.weight, WEIGHTS, "--weight")) as FontWeight,
          palette: opts.palette,
          colors: colors as [string, string] | undefined,
          angle: opts.angle === undefined ? undefined : number(opts.angle, "--angle"),
          background: opts.background,
        });

        emit(result, json);
      } catch (error) {
        fail(error, json);
      }
    });
}
