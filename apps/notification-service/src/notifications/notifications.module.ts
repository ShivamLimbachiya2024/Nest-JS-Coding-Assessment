import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { TaskCompletedHandler } from './task-completed-handler.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, TaskCompletedHandler]
})
export class NotificationsModule {}
