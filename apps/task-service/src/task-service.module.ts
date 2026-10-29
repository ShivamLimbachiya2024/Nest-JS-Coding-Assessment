import { Module } from '@nestjs/common';
import { TaskServiceController } from './task-service.controller.js';
import { TaskServiceService } from './task-service.service.js';
import { TasksModule } from './tasks/tasks.module.js';
import { OutboxModule } from './outbox/outbox.module.js';

@Module({
  imports: [TasksModule, OutboxModule],
  controllers: [TaskServiceController],
  providers: [TaskServiceService],
})
export class TaskServiceModule {}
