#!/usr/bin/env node
import { Command } from "commander";

import { registerAvatar } from "./commands/avatar.js";
import { registerCompress } from "./commands/compress.js";
import { registerConvert } from "./commands/convert.js";
import { registerCrop } from "./commands/crop.js";

const program = new Command();

program
  .name("wb")
  .description("workbench - image and promo tooling")
  .version("0.1.0");

registerAvatar(program);
registerCrop(program);
registerConvert(program);
registerCompress(program);

await program.parseAsync(process.argv);
