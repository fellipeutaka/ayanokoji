# Allow empty Compose service collections for initialization

**Status**: accepted

A valid Compose document may omit `services`; initialization treats that as an empty service collection and preserves all other entries, while removal reports that no services are available and does not write the file.
