import { Module } from '@nestjs/common';

import { ConnectedUsersService } from './connected-users.service';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  providers: [WebsocketGateway, ConnectedUsersService],
})
export class WebsocketModule {}
