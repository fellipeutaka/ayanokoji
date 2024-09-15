import fs from "node:fs/promises";
import type { PrismaSchema } from "./create-prisma-schema";
import { Err, Ok } from "~/utils/result";

export async function writePrismaSchema(
  prismaSchemaPath: string,
  prismaSchema: PrismaSchema
) {
  try {
    await fs.writeFile(prismaSchemaPath, prismaSchema);

    return new Ok(null);
  } catch {
    return new Err("Failed to write prisma schema file.");
  }
}
