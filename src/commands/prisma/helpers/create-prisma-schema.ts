import type { PrismaDatabase } from "../databases";

const defaultGeneratorProvider = "prisma-client-js";
const defaultPreviewFeatures: string[] = [];
const defaultOutput = "node_modules/.prisma/client";

interface CreatePrismaSchemaProps {
  database?: PrismaDatabase;
  generatorProvider?: string;
  previewFeatures?: string[];
  output?: string;
  withModel?: boolean;
}

export function createPrismaSchema(props?: CreatePrismaSchemaProps) {
  const {
    database = "postgresql",
    generatorProvider = defaultGeneratorProvider,
    previewFeatures = defaultPreviewFeatures,
    output = defaultOutput,
    withModel = false,
  } = props || {};

  const aboutAccelerate = `\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n`;

  const isProviderCompatibleWithAccelerate = database !== "sqlite";

  let schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema
${isProviderCompatibleWithAccelerate ? aboutAccelerate : ""}
generator client {
  provider = "${generatorProvider}"
${
  previewFeatures.length > 0
    ? `  previewFeatures = [${previewFeatures.map((feature) => `"${feature}"`).join(", ")}]\n`
    : ""
}${output !== defaultOutput ? `  output = "${output}"\n` : ""}}

datasource db {
  provider = "${database}"
  url      = env("DATABASE_URL")
}
`;

  // We add a model to the schema file if the user passed the --with-model flag
  if (withModel) {
    const defaultAttributes = `email String  @unique
  name  String?`;

    switch (database) {
      case "mongodb":
        schema += `
model User {
  id    String  @id @default(auto()) @map("_id") @db.ObjectId
  ${defaultAttributes}
}
`;
        break;
      case "cockroachdb":
        schema += `
model User {
  id    BigInt  @id @default(sequence())
  ${defaultAttributes}
}
`;
        break;
      default:
        schema += `
model User {
  id    Int     @id @default(autoincrement())
  ${defaultAttributes}
}
`;
    }
  }

  return schema;
}

export type PrismaSchema = ReturnType<typeof createPrismaSchema>;
