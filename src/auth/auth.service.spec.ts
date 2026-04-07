import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

const mockJwtService = { sign: jest.fn().mockReturnValue('fake-token') };

const mockUserRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on valid credentials', async () => {
      const user = {
        pk_user: 'user-123',
        tx_username: 'testuser',
        tx_password: 'hashed-password',
      };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('testuser', 'password123');

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({
        tx_username: 'testuser',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        subscriber: 'user-123',
        username: 'testuser',
      });
      expect(result).toEqual({ access_token: 'fake-token' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.login('nonexistent', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({
        tx_username: 'nonexistent',
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const user = {
        pk_user: 'user-123',
        tx_username: 'testuser',
        tx_password: 'hashed-password',
      };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('testuser', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        'hashed-password',
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
