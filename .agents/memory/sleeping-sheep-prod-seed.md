---
name: Production data seeding pattern
description: How dev data gets into the separate production DB for this project
---

Production uses a separate database that the agent can only read (SELECT via executeSql environment:"production"). The agent cannot write to prod directly.

**Pattern used:** dev data is exported to `artifacts/api-server/seed/seed-data.json` (~37MB — sheep images are base64 data URIs stored in DB rows). On server startup, `seedDatabaseIfEmpty()` inserts all rows (explicit IDs, single transaction, then `setval(pg_get_serial_sequence(...))`) only when the `sheep` table is empty. Republishing makes the deployed server seed its own empty prod DB on first boot.

**Why:** user wanted their dev-collected sheep visible on the published link; startup self-seeding is the only supported write path into prod data.

**How to apply:** if prod data must be refreshed later, re-export the dump (run a small node script from inside `lib/db/` — `pg` only resolves there, not from repo root or /tmp) and note the seed only runs when the sheep table is EMPTY — it will not merge into a non-empty prod DB.

**Gotchas:** the 37MB untracked JSON breaks `architect` includeGitDiff (git diff SIGPIPE) — review with includeGitDiff:false. Dev DB was safely round-tripped (delete all + restart server) to e2e-test the seed path.
