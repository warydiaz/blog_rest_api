import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
