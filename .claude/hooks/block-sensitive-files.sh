#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.command ?? "") } catch {}')
[ -z "$COMMAND" ] && exit 0

if printf '%s' "$COMMAND" | grep -qE "(^|;|&&|\\|\\||\\|)[[:space:]]*(cat|bat|head|tail|less|more|grep|rg|find|sed|awk|git[[:space:]]+(show|diff))[[:space:]]" \
  && printf '%s' "$COMMAND" | grep -qE "(^|[[:space:]/])\\.env([[:space:].]|$)|(^|[[:space:]/])[^[:space:]/]+\\.pem([[:space:]]|$)|(^|[[:space:]/])[^[:space:]/]*credentials[^[:space:]/]*([[:space:]]|$)"; then
  printf '%s\n' "Blocked: do not read environment, key, or credential files through the shell." >&2
  exit 2
fi

exit 0
