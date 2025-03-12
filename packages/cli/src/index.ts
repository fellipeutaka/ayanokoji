#!/usr/bin/env node

import { Command } from "commander";
import { description, name, version } from "../package.json";
import { biome } from "./commands/biome";
import { docker } from "./commands/docker";
import { drizzle } from "./commands/drizzle";
import { gitIgnore } from "./commands/gitignore";
import { prisma } from "./commands/prisma";
import { secret } from "./commands/secret";

const exitProcess = () => process.exit(0);
process.on("SIGINT", exitProcess);
process.on("SIGTERM", exitProcess);

const program = new Command()
  .name(name)
  .description(description)
  .version(version, "-v, --version", "Display the version number.");

program.addCommand(biome);
program.addCommand(docker);
program.addCommand(drizzle);
program.addCommand(gitIgnore);
program.addCommand(prisma);
program.addCommand(secret);

program.parse();
