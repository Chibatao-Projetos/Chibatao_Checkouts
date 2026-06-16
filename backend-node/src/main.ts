import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Rede interna: aceita qualquer origem (auth por Bearer token, não cookies).
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT) || 5000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API Node (NestJS) ouvindo em http://0.0.0.0:${port}/api`);
}
bootstrap();
