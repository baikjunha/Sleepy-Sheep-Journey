---
name: Sleeping Sheep voice-reactive orb
description: How the live conversation screen visualizes the sheep's TTS voice, and its known limitation.
---

# Voice-reactive orb (session screen)

The live conversation screen shows a lavender orb with ripple rings that scales with the app's TTS amplitude (emerald while listening). Amplitude comes from a Web Audio `AnalyserNode` tapped onto the ElevenLabs `<audio>` element inside the speech hook, exposed as `audioLevel` (0..1).

**Key limitation:** the analyser only taps the ElevenLabs `Audio` element. When `ELEVENLABS_API_KEY` is unset the hook falls back to browser `SpeechSynthesis`, which cannot be routed through Web Audio — so the orb still ripples/breathes (isSpeaking=true) but `audioLevel` stays 0 (no amplitude reactivity). Full reactivity requires the ElevenLabs key.

**Why:** `MediaElementAudioSourceNode` can wrap an `HTMLAudioElement`, but there is no analogous cross-browser hook into `SpeechSynthesisUtterance` output.

**How to apply:** if asked why the orb "doesn't react to the voice", first check whether ELEVENLABS_API_KEY is configured — browser-fallback speech has no measurable level.

## Web Audio lifecycle gotchas (learned via review)
- Create one `MediaElementAudioSourceNode` per new `Audio` element (a fresh `Audio` is created each `speak`, so this is safe — a source node can only wrap an element once).
- Must connect `source -> analyser -> destination`, or the audio goes silent.
- Unmount cleanup must call the full audio cleanup (pause + revoke object URL + stop rAF/disconnect) AND `AudioContext.close()`, else playback/URLs leak after navigation.
- In `speak`, stop STT by calling `recognitionRef.current.stop()` directly rather than depending on a `stopListening` callback that closes over `isListening` — avoids a stale-closure race and a TDZ in the deps array (stopListening is declared later).
