import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AuthenticatedUser, JwtPayload } from '../auth/interfaces';
import { CONNECTED_USERS_SERVICE } from './services/connected-users.service.interface';
import type { IConnectedUsersService } from './services/connected-users.service.interface';

interface SocketUserData {
  user?: AuthenticatedUser;
}

@WebSocketGateway()
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CONNECTED_USERS_SERVICE)
    private readonly connectedUsersService: IConnectedUsersService,
  ) {}

  // Guards do not run on the connection event, so authentication must happen
  // in a Socket.IO middleware to reject the handshake before it completes.
  afterInit(server: Server): void {
    server.use((socket, next) => {
      void this.authenticate(socket, next);
    });
  }

  handleConnection(socket: Socket): void {
    const user = (socket.data as SocketUserData).user;
    if (!user) {
      // Defense in depth: never track a socket that skipped the middleware.
      socket.disconnect(true);
      return;
    }

    this.connectedUsersService.add({
      socketId: socket.id,
      userId: user.id,
      connectedAt: new Date(),
    });
    this.logger.log(`User connected: userId=${user.id} socketId=${socket.id}`);
  }

  handleDisconnect(socket: Socket): void {
    const removed = this.connectedUsersService.remove(socket.id);
    if (!removed) {
      return;
    }

    this.logger.log(
      `User disconnected: userId=${removed.userId} socketId=${removed.socketId}`,
    );
  }

  private async authenticate(
    socket: Socket,
    next: (err?: Error) => void,
  ): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('secret'),
        issuer: this.configService.getOrThrow<string>('jwtIssuer'),
        audience: this.configService.getOrThrow<string>('jwtAudience'),
      });

      (socket.data as SocketUserData).user = {
        id: payload.sub,
      };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  }

  private extractToken(socket: Socket): string | undefined {
    const { token } = socket.handshake.auth as { token?: unknown };
    if (typeof token === 'string' && token.length > 0) {
      return token;
    }

    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    return undefined;
  }
}
