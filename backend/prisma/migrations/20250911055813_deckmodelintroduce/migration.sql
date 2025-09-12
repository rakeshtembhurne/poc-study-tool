/*
  Warnings:

  - You are about to drop the column `deck` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `deckId` on the `cards` table. All the data in the column will be lost.
  - Added the required column `deck_id` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cards" DROP CONSTRAINT "cards_deckId_fkey";

-- DropIndex
DROP INDEX "public"."cards_user_id_deck_idx";

-- AlterTable
ALTER TABLE "public"."cards" DROP COLUMN "deck",
DROP COLUMN "deckId",
ADD COLUMN     "deck_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "cards_user_id_deck_id_idx" ON "public"."cards"("user_id", "deck_id");

-- AddForeignKey
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
