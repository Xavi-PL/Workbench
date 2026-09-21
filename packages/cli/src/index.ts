#!/usr/bin/env node
import { Command } from "commander";

import { registerAvatar } from "./commands/avatar.js";

const program = new Command();

program
  .name("wb")
  .description("workbench - image and promo tooling")
  .version("0.1.0");

registerAvatar(program);

await program.parseAsync(process.argv);
