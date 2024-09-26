import { enhancedSelect } from "~/utils/prompts";
import { DATABASES } from "../databases";
import { validDockerComposeFiles } from "./get-existing-docker-compose-file";

export async function getDockerComposeConfig() {
  const fileName = await enhancedSelect({
    message: "What Docker Compose file name would you like to use?",
    options: Array.from(validDockerComposeFiles).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "compose.yaml",
  });

  const database = await enhancedSelect({
    message: "What database would you like to use?",
    options: DATABASES,
    initialValue: "postgres",
  });

  return {
    fileName,
    database: DATABASES.find((db) => db.value === database)!,
  };
}

export type DockerComposeConfig = Awaited<
  ReturnType<typeof getDockerComposeConfig>
>;
