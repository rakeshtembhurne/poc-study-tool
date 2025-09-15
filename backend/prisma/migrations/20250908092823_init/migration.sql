-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sm15_parameters" JSONB NOT NULL DEFAULT '{}',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_review_date" TIMESTAMP(3),
    "total_study_time_minutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "front_content" TEXT NOT NULL,
    "back_content" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "a_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetition_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "lapses_count" INTEGER NOT NULL DEFAULT 0,
    "review_history" JSONB NOT NULL DEFAULT '[]',
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "of_matrix_updates" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" INTEGER NOT NULL,
    "response_time_ms" INTEGER,
    "previous_interval" INTEGER,
    "new_interval" INTEGER NOT NULL,
    "a_factor_before" DOUBLE PRECISION,
    "a_factor_after" DOUBLE PRECISION NOT NULL,
    "optimal_factor_used" DOUBLE PRECISION,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."of_matrix" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "repetition_number" INTEGER NOT NULL,
    "difficulty_category" INTEGER NOT NULL,
    "optimal_factor" DOUBLE PRECISION NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "of_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_statistics" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "new_cards_learned" INTEGER NOT NULL DEFAULT 0,
    "study_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "accuracy_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cards_mastered" INTEGER NOT NULL DEFAULT 0,
    "cards_struggling" INTEGER NOT NULL DEFAULT 0,
    "grade_1_count" INTEGER NOT NULL DEFAULT 0,
    "grade_2_count" INTEGER NOT NULL DEFAULT 0,
    "grade_3_count" INTEGER NOT NULL DEFAULT 0,
    "grade_4_count" INTEGER NOT NULL DEFAULT 0,
    "grade_5_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "cards_user_id_next_review_date_idx" ON "public"."cards"("user_id", "next_review_date");

-- CreateIndex
CREATE INDEX "cards_user_id_label_idx" ON "public"."cards"("user_id", "label");

-- CreateIndex
CREATE INDEX "cards_user_id_a_factor_idx" ON "public"."cards"("user_id", "a_factor");

-- CreateIndex
CREATE INDEX "cards_user_id_repetition_count_idx" ON "public"."cards"("user_id", "repetition_count");

-- CreateIndex
CREATE INDEX "reviews_card_id_review_date_idx" ON "public"."reviews"("card_id", "review_date");

-- CreateIndex
CREATE INDEX "reviews_user_id_review_date_idx" ON "public"."reviews"("user_id", "review_date" DESC);

-- CreateIndex
CREATE INDEX "of_matrix_user_id_repetition_number_difficulty_category_idx" ON "public"."of_matrix"("user_id", "repetition_number", "difficulty_category");

-- CreateIndex
CREATE UNIQUE INDEX "of_matrix_user_id_repetition_number_difficulty_category_key" ON "public"."of_matrix"("user_id", "repetition_number", "difficulty_category");

-- CreateIndex
CREATE INDEX "user_statistics_user_id_date_idx" ON "public"."user_statistics"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_statistics_user_id_date_key" ON "public"."user_statistics"("user_id", "date");

-- AddForeignKey
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."of_matrix" ADD CONSTRAINT "of_matrix_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_statistics" ADD CONSTRAINT "user_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
