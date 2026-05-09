import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sheepSpecsTable = pgTable("sheep_specs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  emotionSummary: text("emotion_summary").notNull(),
  dominantEmotions: text("dominant_emotions").array().notNull().default([]),
  colorIntent: text("color_intent").notNull(),
  textureIntent: text("texture_intent").notNull(),
  shapeIntent: text("shape_intent").notNull(),
  patternIntent: text("pattern_intent").notNull(),
  symbolIntent: text("symbol_intent").notNull(),
  sheepPersonality: text("sheep_personality").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSheepSpecSchema = createInsertSchema(sheepSpecsTable).omit({ id: true, createdAt: true });
export type InsertSheepSpec = z.infer<typeof insertSheepSpecSchema>;
export type SheepSpec = typeof sheepSpecsTable.$inferSelect;
