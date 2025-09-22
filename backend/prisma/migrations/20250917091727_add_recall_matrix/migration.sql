-- CreateTable
CREATE TABLE "public"."recall_matrix" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "interval_days" INTEGER NOT NULL,
    "difficulty_category" INTEGER NOT NULL,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "successful_reviews" INTEGER NOT NULL DEFAULT 0,
    "retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recall_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recall_matrix_user_id_interval_days_difficulty_category_idx" ON "public"."recall_matrix"("user_id", "interval_days", "difficulty_category");

-- CreateIndex
CREATE UNIQUE INDEX "recall_matrix_user_id_interval_days_difficulty_category_key" ON "public"."recall_matrix"("user_id", "interval_days", "difficulty_category");

-- AddForeignKey
ALTER TABLE "public"."recall_matrix" ADD CONSTRAINT "recall_matrix_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
