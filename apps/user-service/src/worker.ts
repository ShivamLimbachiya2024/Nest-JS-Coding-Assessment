import { NestFactory } from '@nestjs/core'
import { TaskflowConfigService } from '@taskflow/config'
import { WorkerQueue } from '@taskflow/contracts'
import { StoryLogger } from '@taskflow/logger'
import { RabbitmqService, WorkerSelection } from '@taskflow/rabbitmq'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import { UserExistenceHandler } from './users/user-existence-handler.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  })
  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()
  const config = app.get(TaskflowConfigService)
  const logger = app.get(StoryLogger)
  const rabbitmq = app.get(RabbitmqService)
  const handler = app.get(UserExistenceHandler)
  const queue = WorkerSelection.select(config.required('WORKER_QUEUE'), [
    WorkerQueue.USER_VERIFICATION,
  ])
  const prefetch = config.integer('WORKER_PREFETCH', 10, 1, 100)

  await rabbitmq.consume(queue, prefetch, (message, delivery) =>
    handler.handle(message, delivery),
  )
  logger.info(
    `User worker ready correlationId=worker-startup operation=start-worker outcome=ready queue=${queue} prefetch=${prefetch}`,
  )
}

await bootstrap()
