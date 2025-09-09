-- CreateTable
CREATE TABLE "visual_components" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "jsxCode" TEXT NOT NULL,
    "description" TEXT,
    "framework" TEXT NOT NULL DEFAULT 'react',
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visual_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visual_components_ownerId_updatedAt_idx" ON "visual_components"("ownerId", "updatedAt");

-- AddForeignKey
ALTER TABLE "visual_components" ADD CONSTRAINT "visual_components_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
