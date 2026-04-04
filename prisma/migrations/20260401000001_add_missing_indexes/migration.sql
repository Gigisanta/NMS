-- AddIndex
CREATE INDEX "time_entries_userId_clockIn_idx" ON "time_entries"("userId", "clockIn");

-- AddIndex
CREATE INDEX "subscriptions_clientId_status_idx" ON "subscriptions"("clientId", "status");

-- AddIndex
CREATE INDEX "attendances_clientId_date_idx" ON "attendances"("clientId", "date");

-- AddIndex
CREATE INDEX "whatsapp_messages_matchedClientId_idx" ON "whatsapp_messages"("matchedClientId");