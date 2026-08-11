import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from '../auth/dto/auth.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('user')
  async getLoggedInUser(@Req() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Patch('save-role')
  async saveRole(@Req() req: any, @Body('role') role: 'passenger' | 'driver') {
    return this.userService.updateRole(req.user.uuid, role);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getUsers() {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':uuid')
  async getUserByUuid(@Param('uuid') uuid: string) {
    return this.userService.findByUuid(uuid);
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}
