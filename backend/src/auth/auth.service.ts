import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async signup(dto: CreateUserDto): Promise<User> {
    const existing = await this.userService.findOne(dto.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    return this.userService.createUser(dto);
  }

  async login(userDto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userService.findOne(userDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(userDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);
    return { user, token };
  }

  async generateToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      uuid: user.uuid,
      email: user.email,
    });
  }
}