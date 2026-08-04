# Conservative Compose volume cleanup

**Status**: accepted

When removing Docker services, Ayanokoji removes only generated local named volume declarations that are no longer referenced by remaining services. It preserves external volumes, bind or anonymous mounts, and declarations with user-defined metadata when ownership is uncertain. This prioritizes preservation of user-owned Compose configuration over aggressive orphan cleanup.
