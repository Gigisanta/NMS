-- Migration: Add billingPeriod to Subscription, make telefono nullable, and add ClientGroup junction table

-- 1. Make telefono nullable on clients (allows shared phone numbers)
ALTER TABLE "clients" ALTER COLUMN "telefono" DROP NOT NULL;

-- Drop the old unique constraint on telefono (PostgreSQL allows multiple NULLs with unique)
DROP INDEX IF EXISTS "clients_telefono_key";

-- 2. Add billingPeriod column to subscriptions with default 'FULL'
ALTER TABLE "subscriptions" ADD COLUMN "billingPeriod" TEXT NOT NULL DEFAULT 'FULL';

-- Drop old unique constraint
DROP INDEX IF EXISTS "subscriptions_clientId_month_year_key";

-- Create new unique constraint that includes billingPeriod
CREATE UNIQUE INDEX "subscriptions_clientId_month_year_billingPeriod_key" ON "subscriptions"("clientId", "month", "year", "billingPeriod");

-- 3. Create ClientGroup junction table for many-to-many client-group relationships
CREATE TABLE "client_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "schedule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_groups_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to prevent duplicate client-group assignments
CREATE UNIQUE INDEX "client_groups_clientId_groupId_key" ON "client_groups"("clientId", "groupId");

-- Create indexes for efficient lookups
CREATE INDEX "client_groups_clientId_idx" ON "client_groups"("clientId");
CREATE INDEX "client_groups_groupId_idx" ON "client_groups"("groupId");
