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
-- Slug comes from the English name; a -2/--3 counter disambiguates pairs that map to the same slug.
INSERT INTO post_categories (slug, name_ar, name_en)
SELECT
  base || CASE WHEN rn > 1 THEN '-' || rn ELSE '' END,
  name_ar, name_en
FROM (
  SELECT name_ar, name_en,
    COALESCE(NULLIF(lower(regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')), ''), 'category') AS base,
    row_number() OVER (
      PARTITION BY COALESCE(NULLIF(lower(regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')), ''), 'category')
      ORDER BY name_ar
    ) AS rn
  FROM (SELECT DISTINCT category_ar AS name_ar, category_en AS name_en FROM posts
        WHERE category_ar <> '' OR category_en <> '') pairs
) numbered;
--> statement-breakpoint
UPDATE posts p
SET category_id = c.id
FROM post_categories c
WHERE c.name_ar = p.category_ar AND c.name_en = p.category_en;