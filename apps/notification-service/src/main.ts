import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ApplicationExceptionFilter } from 'common'
import { AppConfigService } from 'config'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { NotificationServiceModule } from './notification-service.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  })
  const config = app.get(AppConfigService)
  config.validateHttp('NOTIFICATION_SERVICE_PORT')
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
  app.enableShutdownHooks()

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow Notification Service')
    .setDescription('Task completion notifications')
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

  await app.listen(config.integer('NOTIFICATION_SERVICE_PORT', 3003, 1, 65_535))
}

await bootstrap()
