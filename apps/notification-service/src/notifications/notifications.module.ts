import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractsModule } from 'contracts'
import { NotificationEntity } from 'database/notification-service'
import { NotificationsController } from './notifications.controller.js'
import { NotificationsService } from './notifications.service.js'
import { TaskCompletedHandler } from './task-completed-handler.js'

@Module({
  imports: [ContractsModule, TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationsController],
  providers: [NotificationsService, TaskCompletedHandler],
  exports: [TaskCompletedHandler],
})
export class NotificationsModule {}
