import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '@taskflow/auth'
import { CommonModule } from '@taskflow/common'
import { TaskflowConfigModule, TaskflowConfigService } from '@taskflow/config'
import { ContractsModule } from '@taskflow/contracts'
import { DatabaseService } from '@taskflow/database'
import { NotificationEntity } from '@taskflow/database/notification-service'
import { TaskflowLoggerModule } from '@taskflow/logger'
import { RabbitmqModule } from '@taskflow/rabbitmq'
import { NotificationServiceController } from './notification-service.controller.js'
import { NotificationServiceService } from './notification-service.service.js'
import { NotificationsModule } from './notifications/notifications.module.js'

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
          'notifications',
          [NotificationEntity],
          [],
        ),
    }),
    NotificationsModule,
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}
