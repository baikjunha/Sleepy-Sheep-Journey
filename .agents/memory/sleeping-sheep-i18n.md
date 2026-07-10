---
name: Sleeping Sheep i18n & theme
description: How language (ko/en/zh) and night/day theme are wired end-to-end; rules to keep when adding features.
---

# Sleeping Sheep i18n & theme

- Language + theme live in localStorage via `SettingsProvider` (`src/lib/settings.tsx`); it toggles `dark`/`day` classes on `<html>` and exposes `t`, `sttLocale`, `dateLocale`, `isNight`.
- **Rule:** any new user-visible string must go through `t.*` in `src/lib/i18n.ts` (Translation interface + all 3 dicts). This includes decorative English small-caps eyebrows — they are localized, not brand-fixed.
- **Rule:** server-generated text (script endings, sheep spec fallbacks, sheep names, emotion defaults) must come from `LANG_META` in api-server sessions route — every default string needs all 3 languages, or non-Korean sessions silently get Korean text on LLM fallback paths.
- Clients pass `{language}` to generate-empathy and generate-sheep; generate-sheep returns 400 on invalid body rather than defaulting to ko. `imagePrompt` stays English regardless of language.
- Day theme = `.day` class palette in `index.css` (beige #ede0c8-ish); night is default `:root`/`.dark` (#03030f). Stars/decorations render night-only via `isNight`.
- **Why:** architect review failed once because fallback defaults and eyebrow headings bypassed i18n — easy to miss on new pages/routes.
- **How to apply:** when adding a page or server text path, grep for hardcoded Korean/English literals before finishing; add keys to all 3 dicts.
- Gotcha: `architect` review with `includeGitDiff: true` breaks in this repo (37MB seed JSON in diff) — use `includeGitDiff: false` with explicit relevantFiles.
