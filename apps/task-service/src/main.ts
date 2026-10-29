import { NestFactory } from '@nestjs/core';
import { TaskServiceModule } from './task-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(TaskServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
