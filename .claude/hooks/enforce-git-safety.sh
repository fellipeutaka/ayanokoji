#!/usr/bin/env bash

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.command ?? "") } catch {}')
[ -z "$COMMAND" ] && exit 0

block() {
  printf "Blocked: %s. Ask the user for confirmation first.\n" "$1" >&2
  exit 2
}

printf '%s' "$COMMAND" | grep -qE "git push.*(--force|-f\\b|--force-with-lease)" \
  && block "force push rewrites remote history"

printf '%s' "$COMMAND" | grep -qE "git reset --hard" \
  && block "git reset --hard discards local commits irreversibly"

printf '%s' "$COMMAND" | grep -qE "git clean.*-[a-zA-Z]*f" \
  && block "git clean -f permanently deletes untracked files"

printf '%s' "$COMMAND" | grep -qE "git branch -D" \
  && block "git branch -D deletes a branch without a merge check"

printf '%s' "$COMMAND" | grep -qE "git (checkout|restore) (--[[:space:]]*)?(\\.|\\./|\\*)" \
  && block "this command discards working-tree changes"

printf '%s' "$COMMAND" | grep -qE "git (filter-branch|filter-repo)" \
  && block "this command rewrites repository history"

exit 0
