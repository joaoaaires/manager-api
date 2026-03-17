-- CreateIndex
CREATE INDEX "User_email_deleteAt_idx" ON "User"("email", "deleteAt");

-- CreateIndex
CREATE INDEX "User_createAt_idx" ON "User"("createAt");
