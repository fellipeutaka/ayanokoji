import { optional, picklist } from "valibot";
import { PRISMA_DATABASES } from "../databases";

export const prismaDatabaseSchema = optional(
  picklist(PRISMA_DATABASES.map((database) => database.value))
);
