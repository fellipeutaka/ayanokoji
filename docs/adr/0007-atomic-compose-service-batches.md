# Atomic Compose service batches

**Status**: accepted

Adding multiple Docker services is one Compose-document mutation. Ayanokoji must validate the complete batch in memory and write it only when every requested service can be added; one conflict or failure prevents the entire batch from being written.
