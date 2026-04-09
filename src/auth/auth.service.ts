import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOneBy({ tx_username: username });
    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.tx_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { subscriber: user.pk_user, username: user.tx_username };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({
      tx_username: dto.username,
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      tx_username: dto.username,
      tx_password: hashedPassword,
    });
    const saved = await this.userRepo.save(user);

    const payload = { subscriber: saved.pk_user, username: saved.tx_username };
    return { access_token: this.jwtService.sign(payload) };
  }
}
