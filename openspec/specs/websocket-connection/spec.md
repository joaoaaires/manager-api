### Requirement: WebSocket connection requires a valid JWT
The system SHALL expose a Socket.IO WebSocket endpoint and SHALL only accept connections whose handshake presents a JWT that passes verification of signature (`secret`), `issuer` (`jwtIssuer`), `audience` (`jwtAudience`) and expiration, and whose `tenant` claim matches the tenant schema name pattern. The token MUST be read from `handshake.auth.token`, with the `Authorization: Bearer <token>` handshake header accepted as fallback.

#### Scenario: Connection with valid token is accepted
- **WHEN** a client initiates a Socket.IO handshake providing a valid, unexpired JWT with valid `tenant` claim
- **THEN** the connection is established and the authenticated user (`id`, `tenantName`) is attached to the socket

#### Scenario: Connection without token is rejected
- **WHEN** a client initiates a Socket.IO handshake without providing any token
- **THEN** the handshake is rejected with an unauthorized error and no connection is established

#### Scenario: Connection with invalid or expired token is rejected
- **WHEN** a client initiates a Socket.IO handshake with a token that fails signature, issuer, audience, or expiration verification
- **THEN** the handshake is rejected with an unauthorized error and no connection is established

#### Scenario: Connection with invalid tenant claim is rejected
- **WHEN** a client presents a JWT whose `tenant` claim is missing or does not match the tenant schema name pattern
- **THEN** the handshake is rejected with an unauthorized error and no connection is established

### Requirement: Connection and disconnection are logged
The system SHALL write a log entry when an authenticated user connects (login) and when the user disconnects (logout/exit). Each log entry MUST include the user id and tenant name.

#### Scenario: Login is logged on connection
- **WHEN** an authenticated user completes the WebSocket connection
- **THEN** the system logs a connection entry containing the user id and tenant name

#### Scenario: Exit is logged on disconnection
- **WHEN** a connected user's socket disconnects for any reason
- **THEN** the system logs a disconnection entry containing the user id and tenant name

### Requirement: Connected users are tracked in memory
The system SHALL maintain an in-memory array of currently connected users. Each entry MUST record the socket id, user id, tenant name, and connection timestamp. Entries MUST be added when a connection is established and removed when that socket disconnects, keyed by socket id.

#### Scenario: User is added on connection
- **WHEN** an authenticated user completes the WebSocket connection
- **THEN** an entry with the socket id, user id, tenant name, and connection time is appended to the connected-users array

#### Scenario: User is removed on disconnection
- **WHEN** a tracked socket disconnects
- **THEN** the entry matching that socket id is removed from the connected-users array

#### Scenario: Multiple connections from the same user are tracked independently
- **WHEN** the same user connects from two different clients and one of them disconnects
- **THEN** only the entry for the disconnected socket is removed and the other connection remains tracked

#### Scenario: Removing an unknown socket is a no-op
- **WHEN** a disconnect is processed for a socket id that is not present in the array
- **THEN** the array is unchanged and no exit log is produced

### Requirement: WebSocket handshake honors configured CORS origin
The Socket.IO server SHALL apply the same `corsOrigin` configuration used by the HTTP API to its handshake CORS policy.

#### Scenario: Handshake from allowed origin
- **WHEN** a client from the configured `corsOrigin` initiates a handshake
- **THEN** the CORS headers permit the handshake to proceed
