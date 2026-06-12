import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

import { ConnectedUsersService } from './connected-users.service';
import { WebsocketGateway } from './websocket.gateway';

type Middleware = (socket: Socket, next: (err?: Error) => void) => void;

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let connectedUsersService: ConnectedUsersService;
  let logSpy: jest.SpyInstance;

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const configServiceMock = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        secret: 'test-secret',
        jwtIssuer: 'manager-api',
        jwtAudience: 'manager-api-clients',
      };
      return values[key];
    }),
  };

  const buildSocket = (overrides: Record<string, unknown> = {}): Socket =>
    ({
      id: 'socket-1',
      handshake: { auth: {}, headers: {} },
      data: {},
      disconnect: jest.fn(),
      ...overrides,
    }) as unknown as Socket;

  const runMiddleware = (socket: Socket): Promise<Error | undefined> => {
    const server = { use: jest.fn() } as unknown as Server;
    gateway.afterInit(server);
    const middleware = (server.use as jest.Mock).mock.calls[0][0] as Middleware;

    return new Promise((resolve) => {
      middleware(socket, (err?: Error) => resolve(err));
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        ConnectedUsersService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
    connectedUsersService = module.get<ConnectedUsersService>(
      ConnectedUsersService,
    );

    // Drop framework logs emitted during module compilation.
    logSpy.mockClear();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('handshake authentication', () => {
    it('accepts a connection with a valid token and attaches the user', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        tenant: 'tenant_a1b2c3d4',
      });
      const socket = buildSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });

      const error = await runMiddleware(socket);

      expect(error).toBeUndefined();
      expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
        issuer: 'manager-api',
        audience: 'manager-api-clients',
      });
      expect(socket.data).toEqual({
        user: { id: 'user-id', tenantName: 'tenant_a1b2c3d4' },
      });
    });

    it('accepts a token from the Authorization Bearer header as fallback', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        tenant: 'tenant_a1b2c3d4',
      });
      const socket = buildSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      });

      const error = await runMiddleware(socket);

      expect(error).toBeUndefined();
      expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
        'header-token',
        expect.any(Object),
      );
    });

    it('rejects a connection without a token', async () => {
      const socket = buildSocket();

      const error = await runMiddleware(socket);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Unauthorized');
      expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    });

    it('rejects a connection with an invalid or expired token', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const socket = buildSocket({
        handshake: { auth: { token: 'expired-token' }, headers: {} },
      });

      const error = await runMiddleware(socket);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Unauthorized');
    });

    it('rejects a payload without tenant claim', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      const socket = buildSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });

      const error = await runMiddleware(socket);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Unauthorized');
    });

    it('rejects a malformed tenant claim', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        tenant: 'Tenant-X"; DROP SCHEMA public CASCADE; --',
      });
      const socket = buildSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });

      const error = await runMiddleware(socket);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Unauthorized');
    });
  });

  describe('handleConnection', () => {
    it('tracks the user and logs the connection', () => {
      const socket = buildSocket({
        data: { user: { id: 'user-id', tenantName: 'tenant_a1b2c3d4' } },
      });

      gateway.handleConnection(socket);

      expect(connectedUsersService.list()).toEqual([
        expect.objectContaining({
          socketId: 'socket-1',
          userId: 'user-id',
          tenantName: 'tenant_a1b2c3d4',
        }),
      ]);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('User connected: userId=user-id'),
      );
    });

    it('disconnects a socket without an authenticated user', () => {
      const socket = buildSocket();

      gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
      expect(connectedUsersService.list()).toEqual([]);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('removes the user and logs the disconnection', () => {
      const socket = buildSocket({
        data: { user: { id: 'user-id', tenantName: 'tenant_a1b2c3d4' } },
      });
      gateway.handleConnection(socket);

      gateway.handleDisconnect(socket);

      expect(connectedUsersService.list()).toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('User disconnected: userId=user-id'),
      );
    });

    it('does not log when the socket was never tracked', () => {
      const socket = buildSocket();

      gateway.handleDisconnect(socket);

      expect(connectedUsersService.list()).toEqual([]);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
