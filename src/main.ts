import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { ResponseInterceptor } from './common/interceptors/reponse.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173',
  );
  const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Headers',
    ],
  });

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix
  const globalPrefix = configService.get<string>('API_PREFIX') || '/api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Swagger setup (enabled in all environments)
  setupSwagger(app);

  const port = parseInt(
    process.env.PORT || configService.get<string>('APP_PORT') || '8080',
    10,
  );
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 Application is running on: ${await app.getUrl()}/${globalPrefix}`,
  );

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const swaggerPath = isProduction ? 'docs' : 'api-docs';

  logger.log(`📚 API Documentation: ${await app.getUrl()}/${swaggerPath}`);
  logger.log(`📊 Health check: ${await app.getUrl()}/${globalPrefix}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Error during bootstrap:', error);
  process.exit(1);
});
