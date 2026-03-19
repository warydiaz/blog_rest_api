import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterPostDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  slug?: string;
  @IsOptional()
  @IsString()
  excerpt?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return Array.isArray(value) ? value.map(Number) : [Number(value)];
  })
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
