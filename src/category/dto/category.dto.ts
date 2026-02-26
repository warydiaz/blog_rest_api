import { IsOptional, IsString } from 'class-validator';

export class CategoryDto {
  @IsString()
  name: string;
  @IsString()
  slug: string;
  @IsOptional()
  @IsString()
  description?: string;
}
