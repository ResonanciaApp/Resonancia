// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./messages";
export * from "./users";
export * from "./friendships";
export * from "./notifications";
export * from "./direct-messages";
export * from "./push-tokens";
export * from "./shared-mixes";
export * from "./shared-mix-likes";
export * from "./shared-mix-comments";
export * from "./shared-mix-reports";
export * from "./playback-history";
export * from "./favorites";
export * from "./session-progress";
export * from "./catalog-categories";
export * from "./catalog-sessions";
export * from "./catalog-audio-files";
export * from "./uploads";
export * from "./follows";
export * from "./mixer-sounds";
export * from "./shared-glyphs";
export * from "./shared-glyph-likes";