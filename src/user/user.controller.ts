import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';
import type { User } from 'generated/prisma/client';
import { GetUser, GetUserId, GetUserRole } from 'src/auth/decorator';
import { EditUserDto } from './dto';
import { Role } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Patch('me')
  async editUser(@Body() dto: EditUserDto, @GetUserId() userId: number) {
    return await this.userService.editUser(userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @GetUserRole() role: Role,
  ) {
    return await this.userService.deleteUser(userId, role);
  }
}
