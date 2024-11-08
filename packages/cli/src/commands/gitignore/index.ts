import { Command } from "commander";
import { init } from "./init";

export const gitIgnore = new Command("gitignore");

gitIgnore.addCommand(init);
