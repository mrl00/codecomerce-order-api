import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';


const users = [
  { id: 'a65d4b98-80c6-4b59-b59f-c15a983e831a', username: 'admin', password: 'password' },
  { id: '60784d36-51ef-43ee-81b1-34b3a9e89590', username: 'user', password: 'password' },
];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  login(username: string, password: string) {
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = { subscriber: user.id, username: user.username };
    return { access_token: this.jwtService.sign(payload) };
  }
}
