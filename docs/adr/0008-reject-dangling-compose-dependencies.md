# Reject dangling Compose dependencies

**Status**: accepted

Removing a Docker service must be rejected when a known Compose dependency from a remaining service would refer to that removed service. Ayanokoji does not auto-rewrite dependency declarations or infer references from arbitrary unknown fields.
