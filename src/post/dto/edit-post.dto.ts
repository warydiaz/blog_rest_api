import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class EditPostDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  slug?: string;
  @IsOptional()
  @IsString()
  content?: string;
  @IsOptional()
  @IsString()
  excerpt?: string;
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
  @IsOptional()
  @IsBoolean()
  published?: boolean;
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
