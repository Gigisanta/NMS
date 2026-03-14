-- BOLT OPTIMIZATION: Add performance indexes
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");
DROP INDEX "subscriptions_month_year_idx";
CREATE INDEX "subscriptions_month_year_status_idx" ON "subscriptions"("month", "year", "status");
