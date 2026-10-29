import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { TaskflowConfigService } from './config.service.js'

@Global()
@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true })],
  providers: [TaskflowConfigService],
  exports: [TaskflowConfigService],
})
export class TaskflowConfigModule {}
