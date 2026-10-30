import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from 'auth'
import { CommonModule } from 'common'
import { AppConfigModule, AppConfigService } from 'config'
import { ContractsModule } from 'contracts'
import { DatabaseService } from 'database'
import { NotificationEntity } from 'database/notification-service'
import { AppLoggerModule } from 'logger'
import { RabbitmqModule } from 'rabbitmq'
import { NotificationServiceController } from './notification-service.controller.js'
import { NotificationServiceService } from './notification-service.service.js'
import { NotificationsModule } from './notifications/notifications.module.js'

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
