import 'dotenv/config'
import { TaskflowConfigService } from '@taskflow/config'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import { NotificationEntity } from '../entities/notification-service/index.js'

export const notificationDataSource = new DataSource(
  DatabaseService.options(
    new TaskflowConfigService(),
    'notifications',
    [NotificationEntity],
    ['libs/database/src/migrations/notification-service/*.{ts,js}'],
  ),
)

export default notificationDataSource
