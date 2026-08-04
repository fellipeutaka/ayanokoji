# Explicit Compose file selection

**Status**: accepted

When more than one recognized Compose filename exists, Ayanokoji must require explicit user selection rather than silently choosing by filename order. This prevents an additive or removal operation from mutating the wrong user-owned Compose document.
