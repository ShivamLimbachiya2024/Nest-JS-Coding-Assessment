import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '@taskflow/auth'
import { CommonModule } from '@taskflow/common'
import { TaskflowConfigModule, TaskflowConfigService } from '@taskflow/config'
import { ContractsModule } from '@taskflow/contracts'
import { DatabaseService } from '@taskflow/database'
import {
  OutboxMessageEntity,
  TaskEntity,
} from '@taskflow/database/task-service'
import { TaskflowLoggerModule } from '@taskflow/logger'
import { RabbitmqModule } from '@taskflow/rabbitmq'
import { OutboxModule } from './outbox/outbox.module.js'
import { TaskServiceController } from './task-service.controller.js'
import { TaskServiceService } from './task-service.service.js'
import { TasksModule } from './tasks/tasks.module.js'

@Module({
  imports: [
    TaskflowConfigModule,
    TaskflowLoggerModule,
    CommonModule,
    ContractsModule,
    AuthModule,
    RabbitmqModule,
    TypeOrmModule.forRootAsync({
      inject: [TaskflowConfigService],
      useFactory: (config: TaskflowConfigService) =>
        DatabaseService.options(
          config,
          'tasks',
          [TaskEntity, OutboxMessageEntity],
          [],
        ),
    }),
    TasksModule,
    OutboxModule,
  ],
  controllers: [TaskServiceController],
  providers: [TaskServiceService],
})
export class TaskServiceModule {}
