import { Command } from "commander";
import { init } from "./init";
import { remove } from "./remove";

export const biome = new Command("biome");

biome.addCommand(init);
biome.addCommand(remove);
