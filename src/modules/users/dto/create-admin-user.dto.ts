import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  role: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
