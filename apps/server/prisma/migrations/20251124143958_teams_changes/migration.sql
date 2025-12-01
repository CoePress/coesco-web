-- CreateTable
CREATE TABLE "microsoft_graph_tokens" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRefreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "microsoft_graph_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_chat_cache" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_chat_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "microsoft_graph_tokens_employeeId_key" ON "microsoft_graph_tokens"("employeeId");

-- CreateIndex
CREATE INDEX "microsoft_graph_tokens_employeeId_idx" ON "microsoft_graph_tokens"("employeeId");

-- CreateIndex
CREATE INDEX "microsoft_graph_tokens_expiresAt_idx" ON "microsoft_graph_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "teams_chat_cache_employeeId_idx" ON "teams_chat_cache"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_chat_cache_employeeId_recipientUserId_key" ON "teams_chat_cache"("employeeId", "recipientUserId");

-- AddForeignKey
ALTER TABLE "microsoft_graph_tokens" ADD CONSTRAINT "microsoft_graph_tokens_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
