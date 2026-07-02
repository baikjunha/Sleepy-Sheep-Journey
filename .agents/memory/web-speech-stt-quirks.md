---
name: Web Speech STT quirks
description: Browser SpeechRecognition auto-ends and start() races — voice UIs need a keep-alive loop
---

- Browsers end `SpeechRecognition` on their own (~8s silence → `no-speech` error then `onend`). A voice UI that expects ongoing input MUST auto-restart in `onend` while a "desired listening" ref is true, or the mic silently goes dead.
- `recognition.start()` throws `InvalidStateError` if a previous session hasn't fully shut down (`stop()` is async). Use bounded retries with `abort()` + ~350ms delay instead of failing on first throw.
- Fatal error codes to stop retrying on: `not-allowed`, `service-not-allowed`, `audio-capture` → surface a "mic blocked" state and fall back to text input. `no-speech`/`network`/`aborted` are transient.
- **Why:** in Sleeping Sheep, a dead mic + an 18s no-input fallback silently completed sessions, which looked like "the conversation feature disappeared."
- **How to apply:** any Web Speech STT usage — keep desired-state in a ref (not React state), clear it in `speak()`/unmount so TTS playback doesn't revive the mic.
