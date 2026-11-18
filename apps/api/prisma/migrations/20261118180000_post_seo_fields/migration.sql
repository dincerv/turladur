-- Blog Post SEO overrides (platform-admin authored content)
ALTER TABLE "content"."Post"
  ADD COLUMN IF NOT EXISTS "seoTitle" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "seoDescription" VARCHAR(500);
