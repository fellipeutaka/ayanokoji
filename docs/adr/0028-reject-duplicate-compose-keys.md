# Reject duplicate Compose keys

**Status**: accepted

The Compose file adapter rejects duplicate YAML mapping keys instead of silently selecting one value. This prevents parsing from discarding user configuration before semantic-preservation checks can run.
