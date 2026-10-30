import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from 'auth'
import { CommonModule } from 'common'
import { AppConfigModule, AppConfigService } from 'config'
import { ContractsModule } from 'contracts'
import { DatabaseService } from 'database'
import { OutboxMessageEntity, TaskEntity } from 'database/task-service'
import { AppLoggerModule } from 'logger'
import { RabbitmqModule } from 'rabbitmq'
import { OutboxModule } from './outbox/outbox.module.js'
import { TaskServiceController } from './task-service.controller.js'
import { TaskServiceService } from './task-service.service.js'
import { TasksModule } from './tasks/tasks.module.js'

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    CommonModule,
    ContractsModule,
    AuthModule,
    RabbitmqModule,
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
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
