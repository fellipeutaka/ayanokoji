# Controlled filesystem adapter for write failures

**Status**: accepted

The file adapter has a narrow substitutable filesystem seam: production uses the real filesystem, while tests can use a deterministic failing adapter to verify that atomic write failures leave the original Compose file unchanged.
