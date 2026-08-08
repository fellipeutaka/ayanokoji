import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test, vi } from "vitest";

import type { enhancedConfirm, enhancedText } from "~/utils/prompts";

import { DOCKER_DATABASES } from "../databases";

type PostgresConfig = Awaited<
  ReturnType<(typeof DOCKER_DATABASES)[0]["config"]>
>;
type MysqlConfig = Awaited<ReturnType<(typeof DOCKER_DATABASES)[1]["config"]>>;

const promptMocks = vi.hoisted(() => ({
  enhancedConfirm: vi.fn<typeof enhancedConfirm>().mockResolvedValue(true),
  // Vitest's Mock type cannot preserve the generic multiselect signature required by the module factory.
  enhancedMultiselect: vi
    // oxlint-disable-next-line typescript/no-explicit-any
    .fn<(...args: any[]) => Promise<any>>()
    .mockResolvedValue(["postgresql", "mysql"]),
  // Vitest's Mock type cannot preserve the generic select signature required by the module factory.
  enhancedSelect: vi
    // oxlint-disable-next-line typescript/no-explicit-any
    .fn<(...args: any[]) => Promise<any>>()
    .mockResolvedValue("latest"),
  enhancedText: vi.fn<typeof enhancedText>().mockImplementation(
    // Return each requested default so generated service names stay distinct.
    // oxlint-disable-next-line require-await
    async ({ defaultValue }) => defaultValue ?? ""
  ),
}));

vi.mock(import("~/utils/prompts"), () => promptMocks);

describe("initDocker concurrency", () => {
  test("initDocker loads selected database configurations concurrently", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-"));
    const postgresConfigDeferred = Promise.withResolvers<PostgresConfig>();
    const mysqlConfigDeferred = Promise.withResolvers<MysqlConfig>();
    const postgresLoader = vi
      .spyOn(DOCKER_DATABASES[0], "config")
      .mockReturnValue(postgresConfigDeferred.promise);
    const mysqlLoader = vi
      .spyOn(DOCKER_DATABASES[1], "config")
      .mockReturnValue(mysqlConfigDeferred.promise);

    await writeFile(path.join(cwd, "compose.yaml"), "services: {}\n");

    try {
      const { initDocker } = await import("./init-docker");
      const resultPromise = initDocker({ cwd });

      await expect.poll(() => mysqlLoader.mock.calls.length).toBe(1);
      expect(postgresLoader).toHaveBeenCalledOnce();

      const [{ config: postgresConfig }, { config: mysqlConfig }] =
        await Promise.all([
          import("../databases/postgresql"),
          import("../databases/mysql"),
        ]);
      postgresConfigDeferred.resolve(postgresConfig);
      mysqlConfigDeferred.resolve(mysqlConfig);

      const result = await resultPromise;
      expect(result.isOk()).toBeTruthy();
      if (result.isErr()) {
        return;
      }

      expect(
        result.value.imageConfigs.map(({ repository }) => repository)
      ).toStrictEqual(["postgres", "mysql"]);
    } finally {
      postgresLoader.mockRestore();
      mysqlLoader.mockRestore();
      await rm(cwd, { force: true, recursive: true });
    }
  });
});
