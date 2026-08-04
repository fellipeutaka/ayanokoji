# Keep Compose prompts outside the document module

**Status**: accepted

The Compose document module receives explicit mutation intent and remains independent of Commander, interactive prompts, and logging. Command modules own user choices and presentation so the document implementation has a small, deterministic test surface.
