import { IsString } from 'class-validator';

export class EditCommentDto {
  @IsString()
  content: string;
}
