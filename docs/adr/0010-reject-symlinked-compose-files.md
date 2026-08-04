# Reject symlinked Compose files

**Status**: accepted

The Compose file adapter must reject recognized Compose paths that are symlinks before mutation. Atomic replacement must not silently replace a symlink with a regular file and change which user-owned file the CLI edits.
