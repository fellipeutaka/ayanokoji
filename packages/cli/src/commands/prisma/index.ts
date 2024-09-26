import { Command } from "commander";
import { init } from "./init";

export const prisma = new Command("prisma");

prisma.addCommand(init);
