import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const users = [
  {
    id: 'a65d4b98-80c6-4b59-b59f-c15a983e831a',
    username: 'admin',
    password: '$2b$10$X.eVdiN2EcZoZ4td3ee8SOgo/dqTSX0lBzXFyII4rlMccqQU5MP7a',
  },
  {
    id: '60784d36-51ef-43ee-81b1-34b3a9e89590',
    username: 'user',
    password: '$2b$10$X.eVdiN2EcZoZ4td3ee8SOgo/dqTSX0lBzXFyII4rlMccqQU5MP7a',
  },
];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string) {
    const user = users.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { subscriber: user.id, username: user.username };
    return { access_token: this.jwtService.sign(payload) };
  }
}
