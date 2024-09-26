import { Command } from "commander";
import { init } from "./init";

export const drizzle = new Command("drizzle");

drizzle.addCommand(init);
