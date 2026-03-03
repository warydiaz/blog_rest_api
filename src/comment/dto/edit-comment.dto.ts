import { IsInt, IsString } from 'class-validator';

export class EditCommentDto {
  @IsInt()
  id: number;
  @IsString()
  content: string;
}
