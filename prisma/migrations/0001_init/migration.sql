-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "house" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "costCentsPerGram" INTEGER NOT NULL,
    "persistenceHours" INTEGER NOT NULL,
    "stockMg" INTEGER NOT NULL,
    "maxPpt" INTEGER NOT NULL,
    "reorderMg" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetFamilies" TEXT[],
    "targetTop" INTEGER NOT NULL,
    "targetHeart" INTEGER NOT NULL,
    "targetBase" INTEGER NOT NULL,
    "costCeilingCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "concentrationBp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_version" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalPpt" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formula_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_line" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "ppt" INTEGER NOT NULL,

    CONSTRAINT "formula_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tags" TEXT[],
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "bottleCount" INTEGER NOT NULL,
    "bottleMl" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MACERATING',
    "maceratedUntil" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_entry" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "deltaMg" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "batchId" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "house_slug_key" ON "house"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "membership_userId_idx" ON "membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_houseId_userId_key" ON "membership"("houseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_tokenHash_key" ON "session"("tokenHash");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "material_houseId_family_idx" ON "material"("houseId", "family");

-- CreateIndex
CREATE INDEX "material_houseId_active_idx" ON "material"("houseId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "material_houseId_code_key" ON "material"("houseId", "code");

-- CreateIndex
CREATE INDEX "brief_houseId_status_idx" ON "brief"("houseId", "status");

-- CreateIndex
CREATE INDEX "formula_houseId_status_idx" ON "formula"("houseId", "status");

-- CreateIndex
CREATE INDEX "formula_houseId_briefId_idx" ON "formula"("houseId", "briefId");

-- CreateIndex
CREATE INDEX "formula_version_formulaId_status_idx" ON "formula_version"("formulaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "formula_version_formulaId_version_key" ON "formula_version"("formulaId", "version");

-- CreateIndex
CREATE INDEX "formula_line_materialId_idx" ON "formula_line"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "formula_line_versionId_materialId_key" ON "formula_line"("versionId", "materialId");

-- CreateIndex
CREATE INDEX "trial_houseId_createdAt_idx" ON "trial"("houseId", "createdAt");

-- CreateIndex
CREATE INDEX "trial_versionId_idx" ON "trial"("versionId");

-- CreateIndex
CREATE INDEX "batch_houseId_status_idx" ON "batch"("houseId", "status");

-- CreateIndex
CREATE INDEX "batch_versionId_idx" ON "batch"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_houseId_lotCode_key" ON "batch"("houseId", "lotCode");

-- CreateIndex
CREATE INDEX "stock_entry_houseId_materialId_createdAt_idx" ON "stock_entry"("houseId", "materialId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_entry_batchId_idx" ON "stock_entry"("batchId");

-- CreateIndex
CREATE INDEX "audit_event_houseId_createdAt_idx" ON "audit_event"("houseId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_event_entityType_entityId_idx" ON "audit_event"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief" ADD CONSTRAINT "brief_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief" ADD CONSTRAINT "brief_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula" ADD CONSTRAINT "formula_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula" ADD CONSTRAINT "formula_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula" ADD CONSTRAINT "formula_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_line" ADD CONSTRAINT "formula_line_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "formula_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_line" ADD CONSTRAINT "formula_line_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial" ADD CONSTRAINT "trial_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial" ADD CONSTRAINT "trial_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "formula_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial" ADD CONSTRAINT "trial_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "formula_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "house"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Domain guards. The TypeScript layer is the source of truth; these keep the
-- database honest when a script, migration or future service writes directly.

ALTER TABLE "membership" ADD CONSTRAINT "membership_role_check"
  CHECK ("role" IN ('OWNER', 'PERFUMER', 'EVALUATOR', 'LAB'));

ALTER TABLE "material" ADD CONSTRAINT "material_note_check"
  CHECK ("note" IN ('TOP', 'HEART', 'BASE'));
ALTER TABLE "material" ADD CONSTRAINT "material_cost_check"
  CHECK ("costCentsPerGram" >= 0);
ALTER TABLE "material" ADD CONSTRAINT "material_persistence_check"
  CHECK ("persistenceHours" BETWEEN 1 AND 72);
ALTER TABLE "material" ADD CONSTRAINT "material_stock_check"
  CHECK ("stockMg" >= 0);
ALTER TABLE "material" ADD CONSTRAINT "material_maxPpt_check"
  CHECK ("maxPpt" BETWEEN 1 AND 1000);
ALTER TABLE "material" ADD CONSTRAINT "material_reorder_check"
  CHECK ("reorderMg" >= 0);

ALTER TABLE "brief" ADD CONSTRAINT "brief_status_check"
  CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'CLOSED'));
ALTER TABLE "brief" ADD CONSTRAINT "brief_target_check"
  CHECK ("targetTop" BETWEEN 0 AND 100 AND "targetHeart" BETWEEN 0 AND 100 AND "targetBase" BETWEEN 0 AND 100);
ALTER TABLE "brief" ADD CONSTRAINT "brief_target_sum_check"
  CHECK ("targetTop" + "targetHeart" + "targetBase" = 100);
ALTER TABLE "brief" ADD CONSTRAINT "brief_ceiling_check"
  CHECK ("costCeilingCents" >= 0);

ALTER TABLE "formula" ADD CONSTRAINT "formula_status_check"
  CHECK ("status" IN ('DRAFT', 'IN_REVIEW', 'CHANGES', 'APPROVED'));
ALTER TABLE "formula" ADD CONSTRAINT "formula_concentration_check"
  CHECK ("concentrationBp" IN (1200, 2000, 2500));

ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_status_check"
  CHECK ("status" IN ('DRAFT', 'IN_REVIEW', 'CHANGES', 'APPROVED'));
ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_number_check"
  CHECK ("version" > 0);
ALTER TABLE "formula_version" ADD CONSTRAINT "formula_version_total_check"
  CHECK ("totalPpt" BETWEEN 0 AND 1000);

ALTER TABLE "formula_line" ADD CONSTRAINT "formula_line_ppt_check"
  CHECK ("ppt" BETWEEN 1 AND 1000);

ALTER TABLE "trial" ADD CONSTRAINT "trial_score_check"
  CHECK ("score" BETWEEN 1 AND 5);

ALTER TABLE "batch" ADD CONSTRAINT "batch_status_check"
  CHECK ("status" IN ('MACERATING', 'READY', 'RELEASED'));
ALTER TABLE "batch" ADD CONSTRAINT "batch_bottles_check"
  CHECK ("bottleCount" BETWEEN 1 AND 500);
ALTER TABLE "batch" ADD CONSTRAINT "batch_bottleMl_check"
  CHECK ("bottleMl" IN (30, 50, 100));
ALTER TABLE "batch" ADD CONSTRAINT "batch_lot_check"
  CHECK ("lotCode" ~ '^SV-[0-9]{4}-[A-Z0-9]{4}$');

ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_reason_check"
  CHECK ("reason" IN ('INTAKE', 'BATCH', 'ADJUSTMENT'));
ALTER TABLE "stock_entry" ADD CONSTRAINT "stock_entry_delta_check"
  CHECK ("deltaMg" <> 0);

CREATE UNIQUE INDEX "formula_version_one_draft"
  ON "formula_version" ("formulaId") WHERE "status" = 'DRAFT';
CREATE UNIQUE INDEX "formula_version_one_review"
  ON "formula_version" ("formulaId") WHERE "status" = 'IN_REVIEW';

