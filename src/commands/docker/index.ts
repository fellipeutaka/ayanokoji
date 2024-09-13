import { Command } from "commander";
import { init } from "./init";

export const docker = new Command("docker");

docker.addCommand(init);
