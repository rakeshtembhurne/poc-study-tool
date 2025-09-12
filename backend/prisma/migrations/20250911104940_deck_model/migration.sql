-- DropForeignKey
ALTER TABLE "public"."cards" DROP CONSTRAINT "cards_deck_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
