import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private isReady = false;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const useTls = this.configService.get('REDIS_TLS', 'false') === 'true';
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    const redisPassword = this.configService.get('REDIS_PASSWORD');
    const redisDb = this.configService.get('REDIS_DB', 0);

    console.log('[RedisIoAdapter] Creating Redis clients...');
    console.log('[RedisIoAdapter] Host:', redisHost);
    console.log('[RedisIoAdapter] Port:', redisPort);
    console.log('[RedisIoAdapter] TLS:', useTls);
    console.log('[RedisIoAdapter] Database:', redisDb);

    const redisConfig: any = {
      socket: {
        host: redisHost,
        port: redisPort,
      },
      database: redisDb,
    };

    if (redisPassword) {
      redisConfig.password = redisPassword;
    }

    if (useTls) {
      redisConfig.socket.tls = true;
      redisConfig.socket.rejectUnauthorized = false;
      console.log('[RedisIoAdapter] TLS enabled for ElastiCache');
    }

    console.log('[RedisIoAdapter] Creating pub client...');
    const pubClient = createClient(redisConfig);

    console.log('[RedisIoAdapter] Creating sub client...');
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      console.error('[RedisIoAdapter] Pub client error:', err);
    });

    subClient.on('error', (err) => {
      console.error('[RedisIoAdapter] Sub client error:', err);
    });

    pubClient.on('connect', () => {
      console.log('[RedisIoAdapter] Pub client connected');
    });

    subClient.on('connect', () => {
      console.log('[RedisIoAdapter] Sub client connected');
    });

    console.log('[RedisIoAdapter] Connecting clients...');
    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log('[RedisIoAdapter] Both clients connected successfully');

    console.log('[RedisIoAdapter] Creating adapter...');
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.isReady = true;
    console.log('[RedisIoAdapter] Adapter ready for use');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    if (!this.isReady) {
      throw new Error(
        '[RedisIoAdapter] Adapter not ready. Ensure connectToRedis() completed successfully.',
      );
    }
    console.log('[RedisIoAdapter] Creating IO Server with Redis adapter');
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    console.log('[RedisIoAdapter] IO Server created with adapter attached');
    return server;
  }

  isAdapterReady(): boolean {
    return this.isReady;
  }
}
