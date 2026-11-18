import { ConnectedUser } from '../interfaces/index.js';

export const CONNECTED_USERS_SERVICE = Symbol('CONNECTED_USERS_SERVICE');

export interface IConnectedUsersService {
  add(user: ConnectedUser): void;
  remove(socketId: string): ConnectedUser | undefined;
  list(): ConnectedUser[];
}
