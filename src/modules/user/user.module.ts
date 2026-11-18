import { Module } from '@nestjs/common';

import { UserRepository } from './repositories/user.repository.js';
import { USER_REPOSITORY } from './repositories/user.repository.interface.js';
import { UserService } from './services/user.service.js';
import { USER_SERVICE } from './services/user.service.interface.js';
import { UserController } from './user.controller.js';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    {
      provide: USER_SERVICE,
      useClass: UserService,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_SERVICE],
})
export class UserModule {}
