import { Global, Module } from '@nestjs/common'
import { AppConfigModule, AppConfigService } from 'config'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { StoryLogger } from './logger.service.js'

@Global()
@Module({
  imports: [
    AppConfigModule,
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          autoLogging: false,
          base: { service: config.serviceName },
          level: config.isProduction ? 'info' : 'debug',
          quietReqLogger: true,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers.set-cookie',
              'password',
              'passwordHash',
              'token',
              'tokenHash',
            ],
            censor: '[redacted]',
          },
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              },
        },
      }),
    }),
  ],
  providers: [StoryLogger],
  exports: [StoryLogger, PinoLoggerModule],
})
export class AppLoggerModule {}
