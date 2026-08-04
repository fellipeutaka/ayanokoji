# Report independent environment failures

**Status**: accepted

If a requested environment-file update fails after the Compose file has been written, the command reports the successful Compose write and the environment failure, then exits nonzero without attempting a cross-file rollback. Declining the optional update remains a successful operation.
