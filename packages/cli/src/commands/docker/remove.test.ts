import { expect, mock, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";

mock.module("~/utils/prompts", () => ({
  enhancedConfirm: mock(async () => false),
  enhancedMultiselect: mock(async () => ["postgres"]),
  enhancedSelect: mock(async () => "latest"),
  enhancedText: mock(
    async ({ defaultValue }: { defaultValue?: string }) => defaultValue ?? ""
  ),
}));

test("remove command writes the pure removal result", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const composePath = join(cwd, "compose.yaml");

  await writeFile(
    composePath,
    `name: example
services:
  postgres:
    image: postgres:17
    volumes:
      - postgres_data:/var/lib/postgresql/data
  app:
    image: example/app
volumes:
  postgres_data: {}
  shared_data:
    labels:
      owner: user
networks:
  internal:
    driver: bridge
`
  );

  try {
    const { remove } = await import("./remove");
    await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

    const document = parse((await readFile(composePath, "utf8")).toString());
    expect(document).toEqual({
      name: "example",
      services: {
        app: {
          image: "example/app",
        },
      },
      volumes: {
        shared_data: {
          labels: {
            owner: "user",
          },
        },
      },
      networks: {
        internal: {
          driver: "bridge",
        },
      },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
