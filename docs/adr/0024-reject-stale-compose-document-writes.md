# Reject stale Compose document writes

**Status**: accepted

Before replacing an existing Compose file, the file adapter must verify that the file has not changed since it was read. If it has changed, Ayanokoji reports a structured stale-document failure and leaves the newer file untouched rather than overwriting concurrent edits.
