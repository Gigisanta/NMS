-- DropIndex
DROP INDEX "subscriptions_month_year_idx";

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_month_year_status_idx" ON "subscriptions"("month", "year", "status");
