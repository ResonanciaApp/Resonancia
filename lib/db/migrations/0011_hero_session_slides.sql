CREATE TABLE IF NOT EXISTS "hero_session_slides" (
  "id" integer PRIMARY KEY NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "draft" jsonb NOT NULL,
  "published" jsonb,
  "published_revision" integer,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "hero_session_slides_id_check" CHECK ("hero_session_slides"."id" = 1),
  CONSTRAINT "hero_session_slides_revision_check" CHECK ("hero_session_slides"."revision" > 0),
  CONSTRAINT "hero_session_slides_snapshot_check" CHECK (("hero_session_slides"."published" IS NULL) = ("hero_session_slides"."published_revision" IS NULL)
));