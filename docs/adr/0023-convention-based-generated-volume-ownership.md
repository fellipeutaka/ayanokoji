# Convention-based generated volume ownership

**Status**: accepted

Ayanokoji identifies generated Compose volumes by the existing local naming and declaration convention, such as `<serviceName>_data` with a simple top-level declaration. Any deviation is treated as uncertain ownership and preserved; no sidecar metadata is introduced.
