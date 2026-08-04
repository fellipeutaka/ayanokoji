# Fail-closed Compose document validation

**Status**: accepted

If a recognized Compose file contains invalid YAML or an unusable document shape, Ayanokoji must report the error and leave the original file unchanged. It must not coerce malformed input into an empty document or overwrite the user's file.
