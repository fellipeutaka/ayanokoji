#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.command ?? "") } catch {}')
[ -z "$COMMAND" ] && exit 0

declare -A BLOCKED=(
  [npm]="pnpm"
  [npx]="pnpm dlx"
  [yarn]="pnpm"
  [pnpx]="pnpm dlx"
  [deno]="pnpm"
  [vlt]="pnpm"
  [bun]="pnpm"
  [bunx]="pnpm dlx"
)

for binary in "${!BLOCKED[@]}"; do
  preferred="${BLOCKED[$binary]}"
  if printf '%s\n' "$COMMAND" | grep -qE "(^|;|&&|\\|\\||\\|)[[:space:]]*$binary([[:space:]]|$)"; then
    printf "Blocked: use '%s' instead of '%s'.\n" "$preferred" "$binary" >&2
    exit 2
  fi
done

exit 0
