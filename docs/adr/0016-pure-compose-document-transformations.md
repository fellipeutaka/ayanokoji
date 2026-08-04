# Pure Compose document transformations

**Status**: accepted

Compose mutations operate as pure transformations over an in-memory document and return a new document. The original document remains unchanged until the file adapter completes the atomic write.
