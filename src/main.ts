import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate every request body / query against its DTO:
  // - whitelist: strips properties that are not in the DTO
  // - forbidNonWhitelisted: rejects requests that send unknown properties (400)
  // - transform: converts payloads into DTO class instances (e.g. "5" -> 5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
