import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublicProfileDto {
  @IsInt()
  id: number;
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  firstName: string;
  @IsNotEmpty()
  @IsString()
  lastName: string;
  @IsOptional()
  @IsString()
  bio?: string;
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
