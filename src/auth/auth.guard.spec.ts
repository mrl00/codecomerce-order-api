import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  const mockRequest = (headers: Record<string, string | undefined>) => ({
    headers,
  });

  const mockExecutionContext = (request: unknown) => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  });

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    } as unknown as JwtService;

    guard = new AuthGuard(jwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for a valid Bearer token', () => {
    const payload = { subscriber: 'user-123', username: 'admin' };
    (jwtService.verify as jest.Mock).mockReturnValue(payload);

    const request = mockRequest({ authorization: 'Bearer valid-token' });
    const context = mockExecutionContext(request);

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    expect(request['user']).toEqual(payload);
  });

  it('should throw UnauthorizedException when authorization header is missing', () => {
    const request = mockRequest({});
    const context = mockExecutionContext(request);

    expect(() => guard.canActivate(context as any)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when authorization header is undefined', () => {
    const request = mockRequest({ authorization: undefined });
    const context = mockExecutionContext(request);

    expect(() => guard.canActivate(context as any)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when scheme is not Bearer', () => {
    const request = mockRequest({ authorization: 'Basic some-token' });
    const context = mockExecutionContext(request);

    expect(() => guard.canActivate(context as any)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token verification fails', () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const request = mockRequest({ authorization: 'Bearer expired-token' });
    const context = mockExecutionContext(request);

    expect(() => guard.canActivate(context as any)).toThrow(
      UnauthorizedException,
    );
  });
});
