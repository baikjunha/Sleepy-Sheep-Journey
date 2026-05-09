import { pgTable, text, serial, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transcriptTurnsTable = pgTable("transcript_turns", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(), // 'user' | 'sheep' | 'system'
  step: text("step").notNull(),
  text: text("text").notNull(),
  sttConfidence: real("stt_confidence"),
  isAmbiguous: boolean("is_ambiguous").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTranscriptTurnSchema = createInsertSchema(transcriptTurnsTable).omit({ id: true, createdAt: true });
export type InsertTranscriptTurn = z.infer<typeof insertTranscriptTurnSchema>;
export type TranscriptTurn = typeof transcriptTurnsTable.$inferSelect;
