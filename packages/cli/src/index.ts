#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("wb")
  .description("workbench - image and promo tooling")
  .version("0.1.0");

// Subcommands are registered here as each tool lands.

await program.parseAsync(process.argv);
