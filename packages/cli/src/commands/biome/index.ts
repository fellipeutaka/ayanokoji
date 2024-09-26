import { Command } from "commander";
import { init } from "./init";

export const biome = new Command("biome");

biome.addCommand(init);
