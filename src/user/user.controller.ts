import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';
import type { User } from 'generated/prisma/client';
import { GetUser, GetUserId } from 'src/auth/decorator';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Patch()
  async editUser(@Body() dto: EditUserDto, @GetUserId() userId: number) {
    try {
      return await this.userService.editUser(userId, dto);
    } catch (error) {
      if (error instanceof UserError)
        throw new ConflictException(error.message);
      throw error;
    }
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteUser(@GetUserId() userId: number) {
    try {
      return await this.userService.deleteUser(userId);
    } catch (error) {
      if (error instanceof UserError)
        throw new ConflictException(error.message);
      throw error;
    }
  }
}
