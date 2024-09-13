#!/usr/bin/env node

import { Command } from "commander";
import { description, name, version } from "../package.json";
import { biome } from "./commands/biome";
import { docker } from "./commands/docker";

const exitProcess = () => process.exit(0);
process.on("SIGINT", exitProcess);
process.on("SIGTERM", exitProcess);

const program = new Command()
  .name(name)
  .description(description)
  .version(version, "-v, --version", "display the version number");

program.addCommand(biome);
program.addCommand(docker);

program.parse();
