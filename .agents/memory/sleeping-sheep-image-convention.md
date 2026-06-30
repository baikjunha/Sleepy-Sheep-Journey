---
name: Sleeping Sheep image + animation convention
description: How generated sheep images must be produced and displayed so only the sheep animates
---

# Sheep images are transparent-background pixel sprites; only the sheep animates

Sheep are generated as **flat 2D side-profile pixel-art sprites on a transparent
background** (gpt-image-1 with `background: "transparent"` → RGBA PNG), based on six
emotion archetypes (Joy/Anger/Sadness/Peace/Fear/Trust) from the user's reference sheet.

**Why:** the user wants the sheep *inside* the frame to move, not the whole image box.
A transparent sprite placed over a static backdrop and animated (`.animate-sheep` idle
bob/sway/squash in index.css) makes only the sheep appear alive. A baked-in background
makes the whole rectangle look like it's moving — which the user explicitly rejected.

**How to apply:**
- Display sheep with `object-contain` (not `object-cover`) over a static container
  background, so the transparent sprite floats and animates cleanly without revealing
  rectangular edges.
- Keep generation `background: "transparent"`; the IMAGE_STYLE_SUFFIX must demand a single
  isolated sheep with no scenery/ground/shadow/border.
- Quick check whether a stored sheep is new-style: PNG color-type byte (offset 25) is `6`
  (RGBA) for transparent/regenerated sheep vs `2` (RGB) for old baked-background ones.
- The generic image lib `generateImageBuffer` takes an optional 3rd arg
  `background: "transparent" | "opaque" | "auto"` (default "auto" = backward compatible).
