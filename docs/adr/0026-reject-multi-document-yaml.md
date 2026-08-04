# Reject multi-document YAML

**Status**: accepted

A recognized Compose file must contain exactly one YAML document. Ayanokoji rejects multi-document YAML rather than silently reading or replacing only the first document.
