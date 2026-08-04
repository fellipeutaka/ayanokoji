# Reject Compose service-name collisions

**Status**: accepted

Docker initialization must reject a requested service name that already exists in the Compose document, including names chosen through custom prompts. It must never overwrite or merge into an existing service entry; the user must choose another name or skip the entry.
