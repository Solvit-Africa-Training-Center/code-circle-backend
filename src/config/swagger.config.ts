/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  const isProduction = configService.get('NODE_ENV') === 'production';

  const appName = configService.get('APP_NAME') || 'CodeCircle API';

  const appDescription =
    configService.get('SWAGGER_DESCRIPTION') || 'API Documentation';

  const apiVersion = configService.get('SWAGGER_VERSION') || '1.0';
  //const apiPrefix = configService.get('API_PREFIX') || 'api';

  const options = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(appDescription)
    .setVersion(apiVersion)
    .addServer('/', 'Root')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('health', 'Health checks')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Categories', 'Clubs categories')
    .addTag('Tests', 'Tests for joining the club')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for external services',
      },
      'api-key',
    )
    .setExternalDoc(
      'Project Repository',
      'https://github.com/Solvit-Africa-Training-Center/code-circle-backend',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace('Controller', '')}_${methodKey}`,
    ignoreGlobalPrefix: false,
    deepScanRoutes: true,
    extraModels: [],
  });

  const swaggerPath = isProduction ? 'docs' : 'api-docs';

  SwaggerModule.setup(swaggerPath, app, document, {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      tryItOutEnabled: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      syntaxHighlight: {
        theme: 'monokai',
      },
      //validatorUrl: null,
      //plugins: ['TopBar', 'SwaggerUIApiDocs'],
      //urls: [],
    },
    customSiteTitle: `${appName} - API Documentation`,
    // customJs: [
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.min.js',
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-standalone-preset.min.js',
    // ],
  });

  console.log(
    `📚 Swagger documentation available at: http://localhost:${configService.get('APP_PORT')}/${swaggerPath}`,
  );
}
