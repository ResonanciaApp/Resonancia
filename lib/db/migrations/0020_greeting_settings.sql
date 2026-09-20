CREATE TABLE IF NOT EXISTS "greeting_settings" (
  "id" integer PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "text" text,
  "revision" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "greeting_settings_id_check" CHECK ("greeting_settings"."id" = 1),
  CONSTRAINT "greeting_settings_revision_check" CHECK ("greeting_settings"."revision" > 0),
  CONSTRAINT "greeting_settings_text_length_check" CHECK ("greeting_settings"."text" IS NULL OR length("greeting_settings"."text") <= 160),
  CONSTRAINT "greeting_settings_enabled_text_check" CHECK (NOT "greeting_settings"."enabled" OR ("greeting_settings"."text" IS NOT NULL AND length(btrim("greeting_settings"."text")) > 0))
);
INSERT INTO "greeting_settings" ("id", "enabled", "text", "revision")
VALUES (1, false, NULL, 1)
ON CONFLICT ("id") DO NOTHING;