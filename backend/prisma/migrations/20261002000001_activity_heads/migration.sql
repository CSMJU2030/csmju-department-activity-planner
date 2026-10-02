CREATE TABLE "activity_heads" (
  "core_user_id" VARCHAR(64) PRIMARY KEY,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "granted_by" VARCHAR(64) NOT NULL,
  "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_by" VARCHAR(64),
  "revoked_at" TIMESTAMPTZ(3),
  CONSTRAINT "activity_heads_user_not_empty" CHECK (length(btrim("core_user_id")) > 0),
  CONSTRAINT "activity_heads_revocation" CHECK (
    ("active" AND "revoked_by" IS NULL AND "revoked_at" IS NULL) OR
    (NOT "active" AND "revoked_by" IS NOT NULL AND "revoked_at" IS NOT NULL)
  )
);
