CREATE TABLE "post_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill: one category row per distinct (ar, en) text pair already used on posts, then link them.
INSERT INTO post_categories (slug, name_ar, name_en)
SELECT DISTINCT
  COALESCE(NULLIF(lower(regexp_replace(category_en, '[^a-zA-Z0-9]+', '-', 'g')), ''), 'cat')
    || '-' || substr(md5(category_ar || '|' || category_en), 1, 6),
  category_ar, category_en
FROM posts
WHERE category_ar <> '' OR category_en <> '';
--> statement-breakpoint
UPDATE posts p
SET category_id = c.id
FROM post_categories c
WHERE c.name_ar = p.category_ar AND c.name_en = p.category_en;