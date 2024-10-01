import { optional, picklist } from "valibot";
import { DRIZZLE_DATABASES } from "../databases";

export const drizzleDatabaseSchema = optional(
  picklist(DRIZZLE_DATABASES.map((database) => database.value))
);
