import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractsModule } from '@taskflow/contracts'
import {
  OutboxMessageEntity,
  TaskEntity,
} from '@taskflow/database/task-service'
import { RabbitmqModule } from '@taskflow/rabbitmq'
import { TasksController } from './tasks.controller.js'
import { TasksService } from './tasks.service.js'

@Module({
  imports: [
    ContractsModule,
    RabbitmqModule,
    TypeOrmModule.forFeature([TaskEntity, OutboxMessageEntity]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
