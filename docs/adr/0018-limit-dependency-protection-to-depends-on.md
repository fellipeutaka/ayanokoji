# Limit dependency protection to `depends_on`

**Status**: accepted

Dangling-dependency protection initially covers explicit `depends_on` declarations only. Ayanokoji does not infer service references from links, service-scoped network modes, environment strings, or arbitrary unknown fields while the Compose document remains open-world.
