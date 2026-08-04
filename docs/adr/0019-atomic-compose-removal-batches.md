# Atomic Compose removal batches

**Status**: accepted

Removing multiple Docker services is one Compose-document mutation. Ayanokoji must validate the complete removal batch—including dependency and volume rules—before transforming or writing the document; one blocked removal prevents all removals in that batch.
