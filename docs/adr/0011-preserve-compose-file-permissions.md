# Preserve Compose file permissions

**Status**: accepted

When atomically replacing an existing regular Compose file, Ayanokoji preserves its permission mode bits on the replacement. Newly created files use normal filesystem defaults; ownership, ACLs, and extended attributes are outside the current contract.
