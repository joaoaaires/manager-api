import { Logger } from '@nestjs/common';
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
import { TENANT_NAME_PATTERN } from '../tenant/tenant-name.constants';
import { ConnectedUsersService } from './connected-users.service';

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
    private readonly connectedUsersService: ConnectedUsersService,
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
      tenantName: user.tenantName,
      connectedAt: new Date(),
    });
    this.logger.log(
      `User connected: userId=${user.id} tenant=${user.tenantName} socketId=${socket.id}`,
    );
  }

  handleDisconnect(socket: Socket): void {
    const removed = this.connectedUsersService.remove(socket.id);
    if (!removed) {
      return;
    }

    this.logger.log(
      `User disconnected: userId=${removed.userId} tenant=${removed.tenantName} socketId=${removed.socketId}`,
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

      // Same defense as AuthStrategy: the claim reaches raw SQL downstream.
      if (!payload.tenant || !TENANT_NAME_PATTERN.test(payload.tenant)) {
        next(new Error('Unauthorized'));
        return;
      }

      (socket.data as SocketUserData).user = {
        id: payload.sub,
        tenantName: payload.tenant,
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
