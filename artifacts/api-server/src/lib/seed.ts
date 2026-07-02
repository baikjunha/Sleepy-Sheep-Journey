import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import {
  db,
  sessionsTable,
  sheepSpecsTable,
  sheepTable,
  transcriptTurnsTable,
} from "@workspace/db";
import { logger } from "./logger";

interface SeedData {
  sessions: Array<Record<string, unknown>>;
  sheep_specs: Array<Record<string, unknown>>;
  sheep: Array<Record<string, unknown>>;
  transcript_turns: Array<Record<string, unknown>>;
}

const toDate = (v: unknown): Date | null =>
  v == null ? null : new Date(v as string);

export async function seedDatabaseIfEmpty(): Promise<void> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sheepTable);

  if (!row || row.count > 0) {
    logger.info({ sheepCount: row?.count }, "Seed skipped: sheep already exist");
    return;
  }

  const seedPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "seed",
    "seed-data.json",
  );

  if (!fs.existsSync(seedPath)) {
    logger.info({ seedPath }, "Seed skipped: no seed file found");
    return;
  }

  const data = JSON.parse(fs.readFileSync(seedPath, "utf8")) as SeedData;

  await db.transaction(async (tx) => {
    for (const s of data.sessions) {
      await tx.insert(sessionsTable).values({
        id: s.id as number,
        startedAt: toDate(s.started_at) ?? new Date(),
        endedAt: toDate(s.ended_at),
        status: s.status as string,
        currentStep: s.current_step as string,
        sleepFallbackTriggered: s.sleep_fallback_triggered as boolean,
        sheepId: (s.sheep_id as number | null) ?? null,
        createdAt: toDate(s.created_at) ?? new Date(),
        updatedAt: toDate(s.updated_at) ?? new Date(),
      });
    }

    for (const sp of data.sheep_specs) {
      await tx.insert(sheepSpecsTable).values({
        id: sp.id as number,
        sessionId: sp.session_id as number,
        emotionSummary: sp.emotion_summary as string,
        dominantEmotions: (sp.dominant_emotions as string[]) ?? [],
        colorIntent: sp.color_intent as string,
        textureIntent: sp.texture_intent as string,
        shapeIntent: sp.shape_intent as string,
        patternIntent: sp.pattern_intent as string,
        symbolIntent: sp.symbol_intent as string,
        sheepPersonality: sp.sheep_personality as string,
        imagePrompt: sp.image_prompt as string,
        createdAt: toDate(sp.created_at) ?? new Date(),
      });
    }

    for (const sh of data.sheep) {
      await tx.insert(sheepTable).values({
        id: sh.id as number,
        sessionId: sh.session_id as number,
        specId: (sh.spec_id as number | null) ?? null,
        name: sh.name as string,
        imageUrl: sh.image_url as string,
        dominantEmotion: sh.dominant_emotion as string,
        displayColor: sh.display_color as string,
        createdAt: toDate(sh.created_at) ?? new Date(),
      });
    }

    for (const t of data.transcript_turns) {
      await tx.insert(transcriptTurnsTable).values({
        id: t.id as number,
        sessionId: t.session_id as number,
        role: t.role as string,
        step: t.step as string,
        text: t.text as string,
        sttConfidence: (t.stt_confidence as number | null) ?? null,
        isAmbiguous: t.is_ambiguous as boolean,
        createdAt: toDate(t.created_at) ?? new Date(),
      });
    }

    for (const table of [
      "sessions",
      "sheep_specs",
      "sheep",
      "transcript_turns",
    ]) {
      await tx.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${table}))`,
        ),
      );
    }
  });

  logger.info(
    {
      sessions: data.sessions.length,
      sheep: data.sheep.length,
      specs: data.sheep_specs.length,
      turns: data.transcript_turns.length,
    },
    "Seeded database from seed file",
  );
}
