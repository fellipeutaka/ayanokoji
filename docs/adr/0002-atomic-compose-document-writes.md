# Atomic Compose document writes

**Status**: accepted

Updating a Compose document must be atomic: if serialization or writing fails, the original Compose file remains unchanged and the operation reports an error. Ayanokoji may normalize YAML presentation under the semantic-preservation rule, but it must never leave a truncated or partially written Compose file.

This guarantee applies per file. A Compose update and an optional environment-file update are independent operations; a failure in one must be reported without attempting a risky cross-file rollback of the other.
