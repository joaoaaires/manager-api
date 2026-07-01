import { Module } from '@nestjs/common';

import { ConnectedUsersService } from './services/connected-users.service';
import { CONNECTED_USERS_SERVICE } from './services/connected-users.service.interface';
import { WebsocketGateway } from './websocket.gateway';

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
