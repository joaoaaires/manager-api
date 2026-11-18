import { Module } from '@nestjs/common';

import { ConnectedUsersService } from './services/connected-users.service.js';
import { CONNECTED_USERS_SERVICE } from './services/connected-users.service.interface.js';
import { WebsocketGateway } from './websocket.gateway.js';

@Module({
  providers: [
    WebsocketGateway,
    {
      provide: CONNECTED_USERS_SERVICE,
      useClass: ConnectedUsersService,
    },
  ],
})
export class WebsocketModule {}
