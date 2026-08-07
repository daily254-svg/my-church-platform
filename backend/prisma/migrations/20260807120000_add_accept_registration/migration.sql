-- Add acceptRegistration column to Event
ALTER TABLE "Event"
ADD COLUMN IF NOT EXISTS "acceptRegistration" BOOLEAN NOT NULL DEFAULT FALSE;
