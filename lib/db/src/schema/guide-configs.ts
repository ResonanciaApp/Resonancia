import {
  pgTable,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Configuración de sesiones en vivo por guiador.
 * La PK es el `guideId` (slug del guiador, ej. "sofia-ramirez").
 * Los guiadores gestionan su disponibilidad directamente en Cal.com;
 * aquí solo guardamos el link y si tienen habilitadas las sesiones en vivo.
 */
export const guideConfigsTable = pgTable("guide_configs", {
  /** Slug del guiador — debe coincidir con guideId en catalog_sessions. */
  guideId: text("guide_id").primaryKey(),
  /** Nombre para mostrar en la app (evita join con datos estáticos). */
  displayName: text("display_name").notNull().default(""),
  /** Link de Cal.com para que los usuarios reserven. */
  calLink: text("cal_link"),
  /** URL de sala de Daily.co por defecto para este guiador. */
  dailyRoomUrl: text("daily_room_url"),
  /** Si true, aparece en la lista de guiadores con sesiones en vivo. */
  isLiveEnabled: boolean("is_live_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGuideConfigSchema = createInsertSchema(guideConfigsTable).omit({
  updatedAt: true,
});
export const updateGuideConfigSchema = insertGuideConfigSchema.partial().omit({ guideId: true });

export type InsertGuideConfig = z.infer<typeof insertGuideConfigSchema>;
export type UpdateGuideConfig = z.infer<typeof updateGuideConfigSchema>;
export type GuideConfig = typeof guideConfigsTable.$inferSelect;
