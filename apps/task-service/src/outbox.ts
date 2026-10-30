import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { OutboxPublisherService } from './outbox/outbox-publisher.service.js'
import { TaskServiceModule } from './task-service.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(TaskServiceModule, {
    bufferLogs: true,
  })
  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()
  await app.get(OutboxPublisherService).start()
}

await bootstrap()
