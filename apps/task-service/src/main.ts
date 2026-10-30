import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import {
  ApplicationExceptionFilter,
  RequestLoggingInterceptor,
} from '@taskflow/common'
import { TaskflowConfigService } from '@taskflow/config'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { TaskServiceModule } from './task-service.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(TaskServiceModule, { bufferLogs: true })
  const config = app.get(TaskflowConfigService)
  config.validateHttp('TASK_SERVICE_PORT')
  app.useLogger(app.get(Logger))
  app.use(cookieParser())
  app.enableCors({ origin: config.corsOrigins, credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(app.get(ApplicationExceptionFilter))
  app.useGlobalInterceptors(app.get(RequestLoggingInterceptor))
  app.enableShutdownHooks()

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow Task Service')
    .setDescription('Task CRUD, assignment, status transitions, and RBAC')
    .setVersion('current')
    .addCookieAuth(config.accessCookieName, {
      type: 'apiKey',
      in: 'cookie',
    })
    .build()
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  )

  await app.listen(config.integer('TASK_SERVICE_PORT', 3002, 1, 65_535))
}

await bootstrap()
