import 'dotenv/config'
import { AppConfigService } from '../../../config/src/config.service.js'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import { NotificationEntity } from '../entities/notification-service/index.js'

const notificationDataSource = new DataSource(
  DatabaseService.options(
    new AppConfigService(),
    'notifications',
    [NotificationEntity],
    ['libs/database/src/migrations/notification-service/*.{ts,js}'],
  ),
)

export default notificationDataSource
