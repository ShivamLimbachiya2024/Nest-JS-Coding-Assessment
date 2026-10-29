import { Global, Module } from '@nestjs/common'
import { TaskflowConfigModule, TaskflowConfigService } from '@taskflow/config'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { StoryLogger } from './logger.service.js'

@Global()
@Module({
  imports: [
    TaskflowConfigModule,
    PinoLoggerModule.forRootAsync({
      inject: [TaskflowConfigService],
      useFactory: (config: TaskflowConfigService) => ({
        pinoHttp: {
          autoLogging: false,
          customProps: () => ({ service: config.serviceName }),
          level: config.isProduction ? 'info' : 'debug',
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
                  translateTime: 'SYS standard',
                },
              },
        },
      }),
    }),
  ],
  providers: [StoryLogger],
  exports: [StoryLogger, PinoLoggerModule],
})
export class TaskflowLoggerModule {}
