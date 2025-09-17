import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
