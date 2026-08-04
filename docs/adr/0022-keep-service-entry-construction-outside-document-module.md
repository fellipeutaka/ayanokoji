# Keep service-entry construction outside the document module

**Status**: accepted

The Docker catalog constructs service-specific entries and owns their prompts and configuration. The Compose document module receives explicit entries and enforces document-level invariants without importing the service catalog.
