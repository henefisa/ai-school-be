import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('School API docs')
    .setDescription('School API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  await app.listen(configService.getOrThrow('PORT') ?? 3000);

  console.log(
    '\x1b[36m',
    `\nServer listening on: http://localhost:${configService.getOrThrow(
      'PORT',
    )}\nAPI docs: http://localhost:${configService.getOrThrow('PORT')}/docs`,
  );
}

void bootstrap();
