import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;
  @IsString()
  slug: string;
  @IsString()
  content: string;
  @IsOptional()
  @IsString()
  excerpt?: string;
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
  @IsOptional()
  @IsBoolean()
  published?: boolean;
  @IsNumber()
  categoryId: number;
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
