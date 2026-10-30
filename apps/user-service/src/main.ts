import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ApplicationExceptionFilter } from 'common'
import { AppConfigService } from 'config'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get(AppConfigService)
  config.validateUserService()
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
    .setTitle('TaskFlow User Service')
    .setDescription('Users, credentials, sessions, and user queries')
    .setVersion('current')
    .addCookieAuth(config.accessCookieName, {
      type: 'apiKey',
      in: 'cookie',
    })
    .addCookieAuth(
      config.refreshCookieName,
      { type: 'apiKey', in: 'cookie' },
      'refresh_token',
    )
    .build()
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  )

  await app.listen(config.integer('USER_SERVICE_PORT', 3001, 1, 65_535))
}

await bootstrap()
