import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import * as morgan from 'morgan';
import { QueryValidationPipe } from './common/pipes/query-validation.pipe';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  console.log('[BOOTSTRAP] Starting application bootstrap...');
  console.log('[BOOTSTRAP] Node Environment:', process.env.NODE_ENV);
  console.log('[BOOTSTRAP] Port:', process.env.PORT || 3000);

  try {
    console.log('BOOTSTRAP] Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn'] // Only show errors and warnings in production
          : ['error', 'warn', 'debug', 'log', 'verbose'], // Show all logs in development
    });
    console.log('[BOOTSTRAP] NestJS application created successfully');

    const configService = app.get(ConfigService);

    // Redis adapter for Socket.io (for horizontal scaling)
    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter as any);

    // CORS setup - origins from environment variable
    console.log('[BOOTSTRAP] Configuring CORS...');
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : [];
    console.log('📍 [BOOTSTRAP] Allowed Origins:', allowedOrigins);

    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    console.log('[BOOTSTRAP] CORS configured');

    // Set global API prefix - all routes will be prefixed with 'api'
    console.log('[BOOTSTRAP] Setting global prefix to "api"...');
    app.setGlobalPrefix('api');
    console.log('[BOOTSTRAP] Global prefix set');

    // Security headers with Helmet
    console.log('[BOOTSTRAP] Configuring Helmet security headers...');
    app.use(helmet());
    console.log('[BOOTSTRAP] Helmet configured');

    // Disable x-powered-by header
    console.log('[BOOTSTRAP] Disabling x-powered-by header...');
    app.getHttpAdapter().getInstance().disable('x-powered-by');
    console.log('[BOOTSTRAP] x-powered-by header disabled');

    // Compression for responses
    console.log('[BOOTSTRAP] Enabling compression...');
    app.use(compression());
    console.log('[BOOTSTRAP] Compression enabled');

    // Logging
    console.log('[BOOTSTRAP] Setting up Morgan logging...');
    app.use(morgan('dev'));
    console.log('[BOOTSTRAP] Morgan logging configured');

    console.log('🔧 [BOOTSTRAP] Enabling URI versioning...');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    console.log('[BOOTSTRAP] Versioning enabled (default: v1)');

    // Rate limiting to prevent abuse
    // app.use(
    //   rateLimit({
    //     windowMs: 15 * 60 * 1000, // 15 minutes
    //     max: 100, // limit each IP to 100 requests per windowMs
    //     message: 'Too many requests from this IP, please try again later',
    //   }),
    // );

    // Custom validation pipe with Zod that normalizes query arrays (status[] -> status)
    // ZodValidationPipe automatically strips unknown properties (like whitelist: true)
    // Use .strict() in schemas for forbidNonWhitelisted: true behavior
    console.log('[BOOTSTRAP] Setting up global validation pipes...');
    app.useGlobalPipes(new QueryValidationPipe());
    console.log('[BOOTSTRAP] Global validation pipes configured');

    // Swagger setup
    console.log('🔧 [BOOTSTRAP] Configuring Swagger documentation...');
    const config = new DocumentBuilder()
      .setTitle('Sports Recruitment API')
      .setDescription('Sports Recruitment Backend API documentation')
      .setVersion('1.0')
      .addBearerAuth() // If you're using JWT
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log('[BOOTSTRAP] Swagger documentation configured at /api/docs');

    const port = process.env.PORT ?? 3000;
    console.log(`[BOOTSTRAP] Starting to listen on port ${port}...`);
    await app.listen(port);
    console.log(`[BOOTSTRAP] Application is now listening on port ${port}`);

    console.log('========================================');
    console.log('NEST APPLICATION SUCCESSFULLY STARTED! ');
    console.log('========================================');
    console.log(`Port: ${port}`);
    console.log(`API Docs: http://localhost:${port}/api/docs`);
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('BOOTSTRAP FAILED!');
    console.error('========================================');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    console.error('========================================');

    // Exit with error code so ECS knows the container failed
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('========================================');
  console.error('UNHANDLED BOOTSTRAP ERROR!');
  console.error('========================================');
  console.error('Error:', error);
  console.error('========================================');
  process.exit(1);
});
