import { ConnectedUsersService } from './connected-users.service';
import { ConnectedUser } from './interfaces';

describe('ConnectedUsersService', () => {
  let service: ConnectedUsersService;

  const buildUser = (
    overrides: Partial<ConnectedUser> = {},
  ): ConnectedUser => ({
    socketId: 'socket-1',
    userId: 'user-1',
    tenantName: 'tenant_a1b2c3d4',
    connectedAt: new Date('2026-06-11T12:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    service = new ConnectedUsersService();
  });

  it('adds a connected user', () => {
    const user = buildUser();

    service.add(user);

    expect(service.list()).toEqual([user]);
  });

  it('removes a user by socket id and returns the removed entry', () => {
    const user = buildUser();
    service.add(user);

    const removed = service.remove(user.socketId);

    expect(removed).toEqual(user);
    expect(service.list()).toEqual([]);
  });

  it('tracks multiple connections of the same user independently', () => {
    const first = buildUser({ socketId: 'socket-1' });
    const second = buildUser({ socketId: 'socket-2' });
    service.add(first);
    service.add(second);

    const removed = service.remove('socket-1');

    expect(removed).toEqual(first);
    expect(service.list()).toEqual([second]);
  });

  it('returns undefined and keeps the list unchanged for an unknown socket id', () => {
    const user = buildUser();
    service.add(user);

    const removed = service.remove('unknown-socket');

    expect(removed).toBeUndefined();
    expect(service.list()).toEqual([user]);
  });

  it('list returns a copy that does not expose internal state', () => {
    service.add(buildUser());

    const snapshot = service.list();
    snapshot.pop();

    expect(service.list()).toHaveLength(1);
  });
});
