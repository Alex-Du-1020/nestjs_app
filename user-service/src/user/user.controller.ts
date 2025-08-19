import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyToken(@Request() req) {
    return {
      message: 'Token is valid',
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
      },
    };
  }
}

