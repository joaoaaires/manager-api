import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

// Gateway decorator options are evaluated at import time, before the env file
// is loaded, so the configured CORS origin must be injected through an adapter.
export class WebsocketAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly corsOrigin: string,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigin },
    });
  }
}
