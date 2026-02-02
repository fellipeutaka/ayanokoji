import { Command } from "commander";
import { init } from "./init";
import { remove } from "./remove";

export const docker = new Command("docker");

docker.addCommand(init);
docker.addCommand(remove);
