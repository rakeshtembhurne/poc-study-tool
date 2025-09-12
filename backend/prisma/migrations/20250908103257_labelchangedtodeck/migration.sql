/*
  Warnings:

  - You are about to drop the column `label` on the `cards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."cards_user_id_label_idx";

-- AlterTable
ALTER TABLE "public"."cards" DROP COLUMN "label",
ADD COLUMN     "deck" TEXT;

-- CreateIndex
CREATE INDEX "cards_user_id_deck_idx" ON "public"."cards"("user_id", "deck");
