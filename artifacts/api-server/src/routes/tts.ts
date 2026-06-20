import { Router, type Request, type Response } from "express";

const router = Router();

const ELEVENLABS_VOICE_ID = "3qip6fWbB96EiuYuLDNT";
const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

// POST /api/tts — generate speech audio from text using ElevenLabs
router.post("/tts", async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    req.log.error("ELEVENLABS_API_KEY is not configured");
    res.status(503).json({ error: "TTS not configured" });
    return;
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            speed: 0.9,
          },
        }),
      },
    );

    if (!elevenRes.ok) {
      const errBody = await elevenRes.text();
      req.log.error({ status: elevenRes.status, errBody }, "ElevenLabs TTS request failed");
      res.status(502).json({ error: "TTS generation failed" });
      return;
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length.toString());
    res.setHeader("Cache-Control", "no-store");
    res.send(audioBuffer);
  } catch (err) {
    req.log.error({ err }, "Failed to generate TTS");
    res.status(500).json({ error: "Failed to generate TTS" });
  }
});

export default router;
