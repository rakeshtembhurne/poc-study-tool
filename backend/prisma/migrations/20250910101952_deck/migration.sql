-- AlterTable
ALTER TABLE "public"."cards" ADD COLUMN     "deckId" INTEGER;

-- CreateTable
CREATE TABLE "public"."decks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "decks_user_id_title_key" ON "public"."decks"("user_id", "title");

-- AddForeignKey
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
