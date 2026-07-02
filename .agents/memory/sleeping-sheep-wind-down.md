---
name: Sleeping Sheep wind-down / rest flow
description: The end-of-session "fall asleep" screen — where it lives, why music is a static file, and the autoplay caveat.
---

# End-of-session wind-down (`/rest/:id`)

After the voice session completes → sheep generated → `/sheep/:id` result page. The result page's primary CTA ("이제 잠들기") routes to `/rest/:id` (RestScreen): shows the emotion summary from `sheep.spec` (dominantEmotions + emotionSummary), fades in looping calm music, dims a black overlay over ~5 min, then shows a black "잘 자요" end screen ("app off").

**Music is a pre-generated static file** at `artifacts/sleeping-sheep/public/sleep-music.mp3` (generateMusic, ~180s loop), not runtime TTS/ElevenLabs. Reference via `${import.meta.env.BASE_URL}sleep-music.mp3` (base-path aware) — never a root-relative `/sleep-music.mp3`.

**Why the tap-to-resume:** browsers block audio autoplay before a user gesture. RestScreen starts playback in an effect but also resumes on the first tap (`resumeAudio`); do not assume music auto-starts.

**How to apply:** any timed audio+visual screen here must track every interval/timeout (incl. inner fade intervals) in refs and clear them in the effect cleanup, or leaving the screen mid-fade leaks a running interval.
