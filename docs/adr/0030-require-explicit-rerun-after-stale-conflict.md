# Require explicit rerun after a stale conflict

**Status**: accepted

When a Compose file changes between read and write, Ayanokoji aborts with a stale-document failure and requires an explicit rerun. It does not reread and silently retry an operation formed from obsolete state.
