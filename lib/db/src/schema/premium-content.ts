import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";
export type PremiumSectionContent = { title: string; description: string; images: string[] };
export type PremiumEditorialContent = Record<"sounds" | "sleep" | "home" | "profile", PremiumSectionContent>;
export const DEFAULT_PREMIUM_CONTENT: PremiumEditorialContent = {
  sounds: { title: "Suscríbete al Plan Premium", description: "Accede a una librería de más de 300 sonidos ambientales de Chile y el mundo", images: [] },
  sleep: { title: "¿Problemas para dormir?", description: "Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.", images: Array.from({ length: 10 }, (_, i) => `builtin:${i}`) },
  home: { title: "Prueba Premium Gratis", description: "Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.", images: Array.from({ length: 10 }, (_, i) => `builtin:${i}`) },
  profile: { title: "Prueba Premium", description: "Tu transformación comienza acá", images: [] },
};
export const premiumContentSettingsTable = pgTable("premium_content_settings", {
  id: integer("id").primaryKey(),
  content: jsonb("content").$type<PremiumEditorialContent>().notNull(),
  revision: integer("revision").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
