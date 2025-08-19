import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import axios from 'axios';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      // 调用用户服务验证token
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
      const response = await axios.post(
        `${userServiceUrl}/api/users/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ExtractJwt.fromAuthHeaderAsBearerToken()}`,
          },
        }
      );
      
      return response.data.user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

