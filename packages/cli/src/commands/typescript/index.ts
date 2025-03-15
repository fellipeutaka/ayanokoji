import { Command } from "commander";
import { init } from "./init";

export const typescript = new Command("typescript");

typescript.addCommand(init);
