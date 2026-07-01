## ADDED Requirements

### Requirement: ConnectedUsersService interface with symbolic token
The websocket module SHALL define an `IConnectedUsersService` interface and a `CONNECTED_USERS_SERVICE` Symbol token in `src/modules/websocket/services/connected-users.service.interface.ts`. The interface SHALL expose `add(user: ConnectedUser): void`, `remove(socketId: string): ConnectedUser | undefined`, and `list(): ConnectedUser[]`.

#### Scenario: ConnectedUsersService resolves via token injection
- **WHEN** `WebsocketModule` provides `{ provide: CONNECTED_USERS_SERVICE, useClass: ConnectedUsersService }`
- **THEN** `WebsocketGateway` receives an `IConnectedUsersService` via `@Inject(CONNECTED_USERS_SERVICE)`

### Requirement: ConnectedUsersService moved to services/ subfolder
The `ConnectedUsersService` class SHALL be located at `src/modules/websocket/services/connected-users.service.ts` and SHALL implement `IConnectedUsersService`. The file `src/modules/websocket/connected-users.service.ts` SHALL be removed.

#### Scenario: WebsocketModule imports ConnectedUsersService from services/ path
- **WHEN** `WebsocketModule` is compiled
- **THEN** it imports `ConnectedUsersService` from `./services/connected-users.service`

### Requirement: WebsocketGateway injects IConnectedUsersService via token
`WebsocketGateway` SHALL inject `IConnectedUsersService` using `@Inject(CONNECTED_USERS_SERVICE)` instead of depending on the concrete `ConnectedUsersService` class.

#### Scenario: Gateway uses injected service to add a user
- **WHEN** a WebSocket connection is established and `handleConnection` is invoked
- **THEN** the gateway calls `this.connectedUsersService.add(...)` on the injected `IConnectedUsersService`

#### Scenario: Gateway uses injected service to remove a user
- **WHEN** a WebSocket disconnection occurs and `handleDisconnect` is invoked
- **THEN** the gateway calls `this.connectedUsersService.remove(socketId)` on the injected `IConnectedUsersService`

### Requirement: WebsocketModule provides ConnectedUsersService via symbolic token
`WebsocketModule` SHALL register `ConnectedUsersService` with `{ provide: CONNECTED_USERS_SERVICE, useClass: ConnectedUsersService }` instead of as a plain provider.

#### Scenario: WebsocketModule compiles and wires correctly
- **WHEN** `WebsocketModule` is bootstrapped
- **THEN** `WebsocketGateway` has a fully-injected `IConnectedUsersService` available
