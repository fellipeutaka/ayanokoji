#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.command ?? "") } catch {}')
[ -z "$COMMAND" ] && exit 0

declare -A BLOCKED=(
  [npm]="bun"
  [npx]="bunx"
  [yarn]="bun"
  [pnpm]="bun"
  [pnpx]="bunx"
  [deno]="bun"
  [vlt]="bun"
)

for binary in "${!BLOCKED[@]}"; do
  preferred="${BLOCKED[$binary]}"
  if printf '%s\n' "$COMMAND" | grep -qE "(^|;|&&|\\|\\||\\|)[[:space:]]*$binary([[:space:]]|$)"; then
    printf "Blocked: use '%s' instead of '%s'.\n" "$preferred" "$binary" >&2
    exit 2
  fi
done

exit 0
