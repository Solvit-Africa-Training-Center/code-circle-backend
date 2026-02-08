import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  const appName = configService.get<string>('APP_NAME') || 'CodeCircle API';

  const appDescription =
    configService.get<string>('SWAGGER_DESCRIPTION') || 'API Documentation';

  const apiVersion = configService.get<string>('SWAGGER_VERSION') || '1.0';

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
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('Tests', 'Test management')
    .addTag('Categories', 'Test categories')
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
      defaultModelsExpandDepth: -1,
      defaultModelExpandDepth: -1,
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
