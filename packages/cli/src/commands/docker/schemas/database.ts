import { optional, picklist } from "valibot";
import { DOCKER_DATABASES } from "../databases";

export const dockerDatabaseSchema = optional(
  picklist(DOCKER_DATABASES.map((database) => database.value))
);
