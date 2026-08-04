# Separate Compose and environment mutations

**Status**: accepted

The Compose document module does not generate or remove environment variables. Environment synchronization runs as a separate operation after a successful Compose-file write, with its own per-file failure handling and no cross-file rollback.
