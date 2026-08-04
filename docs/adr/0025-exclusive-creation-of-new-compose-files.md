# Exclusive creation of new Compose files

**Status**: accepted

When initialization started without an existing Compose file, the selected path must be created exclusively. If another process creates it before the write, Ayanokoji reports a conflict instead of overwriting that file.
