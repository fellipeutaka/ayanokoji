#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.command ?? "") } catch {}')
[ -z "$COMMAND" ] && exit 0

if printf '%s' "$COMMAND" | grep -qE "(^|;|&&|\\|\\||\\|)[[:space:]]*(cat|bat|head|tail|less|more|grep|rg|find|sed|awk)[[:space:]].*node_modules/"; then
  PACKAGE=$(printf '%s' "$COMMAND" | grep -oE "node_modules/(@[^/[:space:]]+/[^/[:space:]]+|[^/[:space:]]+)" | head -1 | sed 's|node_modules/||')
  printf '%s\n' "Blocked: do not read node_modules/ directly; dependency files are compiled or generated." >&2
  printf '%s\n' "Use opensrc to fetch the original source instead." >&2
  printf '  opensrc path %s\n' "${PACKAGE:-<package>}" >&2
  exit 2
fi

exit 0
