import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test, vi } from "vitest";
import { parse } from "yaml";

import type { handleError } from "~/utils/handle-error";
import type { enhancedConfirm, enhancedText } from "~/utils/prompts";

const { confirmState, enhancedSelectMock, handleErrorMock, promptMocks } =
  vi.hoisted(() => {
    const mockConfirmState = { value: false };
    // Keep the synchronous handleError contract so mocked command failures stop
    // execution just like the process-exiting production implementation.
    const mockHandleError = vi.fn<typeof handleError>(
      // oxlint-disable-next-line promise/prefer-await-to-callbacks
      (error: string): never => {
        throw new Error(error);
      }
    );
    // Vitest's Mock type cannot preserve the generic select signature required by the module factory.
    const mockEnhancedSelect = vi
      // oxlint-disable-next-line typescript/no-explicit-any
      .fn<(...args: any[]) => Promise<any>>();
    // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
    mockEnhancedSelect.mockResolvedValue("latest");
    const mockPromptMocks = {
      // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
      enhancedConfirm: vi.fn<typeof enhancedConfirm>(
        // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
        // oxlint-disable-next-line require-await
        async () => mockConfirmState.value
      ),
      // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
      // Vitest's Mock type cannot preserve the generic multiselect signature required by the module factory.
      enhancedMultiselect: vi
        // oxlint-disable-next-line typescript/no-explicit-any
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValue(["postgres"]),
      enhancedSelect: mockEnhancedSelect,
      enhancedText: vi.fn<typeof enhancedText>(
        // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
        // oxlint-disable-next-line require-await
        async ({ defaultValue }) => defaultValue ?? ""
      ),
    };

    return {
      confirmState: mockConfirmState,
      enhancedSelectMock: mockEnhancedSelect,
      handleErrorMock: mockHandleError,
      promptMocks: mockPromptMocks,
    };
  });

vi.mock(import("~/utils/handle-error"), () => ({
  handleError: handleErrorMock,
}));

vi.mock(import("~/utils/prompts"), () => promptMocks);

describe("remove command", () => {
  test("remove command writes the pure removal result", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));
    const composePath = path.join(cwd, "compose.yaml");

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

      const document: unknown = parse(await readFile(composePath, "utf-8"));
      expect(document).toStrictEqual({
        name: "example",
        networks: {
          internal: {
            driver: "bridge",
          },
        },
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
      });
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("remove reports a missing Compose document without creating one", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));

    try {
      const { remove } = await import("./remove");

      await expect(
        remove.parseAsync(["node", "ayanokoji", "--cwd", cwd])
      ).rejects.toThrow("No Docker Compose file found.");
      await expect(readdir(cwd)).resolves.toStrictEqual([]);
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("remove reports no services without writing a valid document", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));
    const composePath = path.join(cwd, "compose.yaml");
    const source = "name: example\nnetworks:\n  internal: {}\n";
    await writeFile(composePath, source);

    try {
      const { remove } = await import("./remove");

      await expect(
        remove.parseAsync(["node", "ayanokoji", "--cwd", cwd])
      ).rejects.toThrow("No services found in the compose file.");
      await expect(readFile(composePath, "utf-8")).resolves.toBe(source);
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("remove prompts for a candidate when multiple Compose files exist", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));
    const firstPath = path.join(cwd, "compose.yaml");
    const secondPath = path.join(cwd, "docker-compose.yml");
    const source = `services:
  postgres:
    image: postgres:17
`;
    await writeFile(firstPath, source);
    await writeFile(secondPath, source);

    // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
    // oxlint-disable-next-line require-await
    enhancedSelectMock.mockResolvedValueOnce("docker-compose.yml");

    try {
      const { remove } = await import("./remove");
      await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

      await expect(readFile(secondPath, "utf-8")).resolves.not.toBe(source);
      await expect(readFile(firstPath, "utf-8")).resolves.toBe(source);
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("remove reports an environment failure after the Compose file is written", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));
    const composePath = path.join(cwd, "compose.yaml");
    const envPath = path.join(cwd, "env-directory");
    await writeFile(
      composePath,
      `services:
  postgres:
    image: postgres:17
`
    );
    await mkdir(envPath);

    try {
      const { remove } = await import("./remove");

      await expect(
        remove.parseAsync([
          "node",
          "ayanokoji",
          "--cwd",
          cwd,
          "--env-path",
          envPath,
        ])
      ).rejects.toThrow(
        "Docker Compose file was written successfully, but environment synchronization failed"
      );

      await expect(readFile(composePath, "utf-8")).resolves.not.toContain(
        "postgres:"
      );
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("remove synchronizes environment cleanup after a successful Compose write", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-remove-"));
    const composePath = path.join(cwd, "compose.yaml");
    const envPath = path.join(cwd, ".env");
    await writeFile(
      composePath,
      `services:
  postgres:
    image: postgres:17
`
    );
    await writeFile(envPath, "POSTGRESQL_URL=postgresql://docker\n");
    confirmState.value = true;

    try {
      const { remove } = await import("./remove");
      await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

      await expect(readFile(composePath, "utf-8")).resolves.not.toContain(
        "postgres:"
      );
      await expect(readFile(envPath, "utf-8")).resolves.toBe("\n");
    } finally {
      confirmState.value = false;
      await rm(cwd, { force: true, recursive: true });
    }
  });
});
