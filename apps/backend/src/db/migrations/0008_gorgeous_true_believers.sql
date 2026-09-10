CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"locale" text DEFAULT 'ar' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'article' NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"excerpt_ar" text DEFAULT '' NOT NULL,
	"excerpt_en" text DEFAULT '' NOT NULL,
	"content_ar" text DEFAULT '' NOT NULL,
	"content_en" text DEFAULT '' NOT NULL,
	"category_ar" text DEFAULT '' NOT NULL,
	"category_en" text DEFAULT '' NOT NULL,
	"author_ar" text DEFAULT '' NOT NULL,
	"author_en" text DEFAULT '' NOT NULL,
	"seo_title_ar" text DEFAULT '' NOT NULL,
	"seo_title_en" text DEFAULT '' NOT NULL,
	"seo_description_ar" text DEFAULT '' NOT NULL,
	"seo_description_en" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_comments_post_status_idx" ON "post_comments" USING btree ("post_id","status");--> statement-breakpoint
CREATE INDEX "posts_publication_idx" ON "posts" USING btree ("status","type","published_at");