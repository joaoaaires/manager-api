import { Injectable } from '@nestjs/common';

import { ConnectedUser } from '../interfaces';
import { IConnectedUsersService } from './connected-users.service.interface';

// In-memory store, single instance only; swap for a shared store (e.g. Redis)
// before scaling horizontally.
@Injectable()
export class ConnectedUsersService implements IConnectedUsersService {
  private readonly users: ConnectedUser[] = [];

  add(user: ConnectedUser): void {
    this.users.push(user);
  }

  remove(socketId: string): ConnectedUser | undefined {
    const index = this.users.findIndex((user) => user.socketId === socketId);
    if (index === -1) {
      return undefined;
    }

    const [removed] = this.users.splice(index, 1);
    return removed;
  }

  list(): ConnectedUser[] {
    return [...this.users];
  }
}
