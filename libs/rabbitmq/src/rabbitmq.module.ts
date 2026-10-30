import { Global, Module } from '@nestjs/common'
import { AppConfigModule } from 'config'
import { AppLoggerModule } from 'logger'
import { RabbitmqService } from './rabbitmq.service.js'

@Global()
@Module({
  imports: [AppConfigModule, AppLoggerModule],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
