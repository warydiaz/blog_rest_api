import { IsString } from 'class-validator';

export class EditCoverDto {
  @IsString()
  coverImageUrl?: string;
}
