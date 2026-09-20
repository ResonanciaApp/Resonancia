CREATE TABLE IF NOT EXISTS "reflection_stories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "idempotency_key" text NOT NULL,
  "message" text NOT NULL,
  "category" text NOT NULL,
  "background_preset_key" text NOT NULL,
  "background_scale" real NOT NULL,
  "background_x" real NOT NULL,
  "background_y" real NOT NULL,
  "text_x" real NOT NULL,
  "text_y" real NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reflection_stories_category_check" CHECK ("reflection_stories"."category" in ('gratitude', 'understanding', 'clarity', 'calm', 'purpose', 'acceptance')),
  CONSTRAINT "reflection_stories_message_check" CHECK (length(btrim("reflection_stories"."message")) >= 1),
  CONSTRAINT "reflection_stories_scale_check" CHECK ("reflection_stories"."background_scale" between 1 and 3),
  CONSTRAINT "reflection_stories_background_x_check" CHECK ("reflection_stories"."background_x" between -(("reflection_stories"."background_scale" - 1) / 2) and (("reflection_stories"."background_scale" - 1) / 2)),
  CONSTRAINT "reflection_stories_background_y_check" CHECK ("reflection_stories"."background_y" between -(("reflection_stories"."background_scale" - 1) / 2) and (("reflection_stories"."background_scale" - 1) / 2)),
  CONSTRAINT "reflection_stories_text_x_check" CHECK ("reflection_stories"."text_x" between -0.0925925926 and 0.0925925926),
  CONSTRAINT "reflection_stories_text_y_check" CHECK ("reflection_stories"."text_y" between -0.2604166667 and 0.2604166667)
);
ALTER TABLE "reflection_stories" ADD CONSTRAINT "reflection_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX IF NOT EXISTS "reflection_stories_user_idempotency_idx" ON "reflection_stories" USING btree ("user_id","idempotency_key");
CREATE INDEX IF NOT EXISTS "reflection_stories_user_created_id_idx" ON "reflection_stories" USING btree ("user_id","created_at","id");