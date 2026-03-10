import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';
import type { User } from 'generated/prisma/client';
import { GetUser, GetUserId, Roles } from 'src/auth/decorator';
import { EditUserDto } from './dto';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  static readonly IMAGE_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Patch('me')
  async editUser(@Body() dto: EditUserDto, @GetUserId() userId: number) {
    return await this.userService.editUser(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @GetUserId('id') userId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: UserController.IMAGE_SIZE_LIMIT,
          }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.userService.updateAvatar(userId, file);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':username')
  async getPublicProfile(@Param('username') username: string) {
    return await this.userService.getPublicProfile(username);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id', ParseIntPipe) userId: number) {
    return await this.userService.deleteUser(userId);
  }
}
