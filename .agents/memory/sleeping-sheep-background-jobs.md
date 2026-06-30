---
name: Sleeping Sheep background generation jobs
description: Operational gotcha for the api-server fire-and-forget sheep generation/regeneration jobs
---

# Sheep generation runs as in-process fire-and-forget jobs

`POST /api/sessions/:id/generate-sheep` and `POST /api/sheep/regenerate-all` respond
immediately (202) and do the LLM-spec + gpt-image-1 work in the background **inside the
Express process**. There is no job persistence, queue, or resume.

**Why it matters:** each sheep image takes ~55s. A full `regenerate-all` over the saved
flock (13+ sheep) runs 10-20 min. Restarting the `api-server` workflow mid-run silently
aborts the job partway with no resume — already-processed rows keep their new image, the
rest keep the old one.

**How to apply:**
- Do NOT restart the api-server workflow while a long generation/regeneration job is in flight.
- Don't "test" these POST endpoints casually — a call really kicks off the expensive job
  (and real OpenAI image cost). `regenerate-all` has an in-memory single-flight guard
  (`isRegeneratingAll`) that returns 409 on overlap, but the first call still runs for real.
- To cleanly cancel a redundant/running job, restart the workflow (kills it; guard resets to false).

## One-off image regeneration jobs

The `@workspace/integrations-openai-ai-server` lib is **TS-source-only** (no standalone
runnable JS; api-server bundles it via esbuild). It cannot be `await import()`-ed from the
code_execution sandbox or run via plain `node` from the workspace root.

**How to apply:** to run a one-off job that needs `generateImageBuffer` + DB (e.g. seed/patch
specific sheep images), add a *temporary* fire-and-forget POST endpoint in
`artifacts/api-server/src/routes/sessions.ts` (mirror the regenerate-all pattern: in-memory
single-flight guard, respond 202, do work in background), restart the workflow, `curl` it once,
poll `GET /api/sheep` until done, then delete the endpoint and restart again. The api-server
workflow already has `AI_INTEGRATIONS_OPENAI_*` + `DATABASE_URL` wired.
