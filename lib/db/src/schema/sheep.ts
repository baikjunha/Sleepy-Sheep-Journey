import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sheepTable = pgTable("sheep", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  specId: integer("spec_id"),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  dominantEmotion: text("dominant_emotion").notNull(),
  displayColor: text("display_color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSheepSchema = createInsertSchema(sheepTable).omit({ id: true, createdAt: true });
export type InsertSheep = z.infer<typeof insertSheepSchema>;
export type Sheep = typeof sheepTable.$inferSelect;
