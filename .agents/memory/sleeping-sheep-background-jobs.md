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
