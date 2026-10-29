import { Global, Module } from '@nestjs/common'
import { TaskflowConfigModule } from '@taskflow/config'
import { TaskflowLoggerModule } from '@taskflow/logger'
import { RabbitmqService } from './rabbitmq.service.js'

@Global()
@Module({
  imports: [TaskflowConfigModule, TaskflowLoggerModule],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
