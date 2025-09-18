import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PromptInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string; // text from frontend input

  @IsString()
  @IsNotEmpty()
  deckName: string; // deck name from frontend input
}
