import { AppConfigService } from '../../../config/src/config.service.js'
import { DataSource } from 'typeorm'
import { NotificationEntity } from '../notification-service/index.js'
import { OutboxMessageEntity, TaskEntity } from '../task-service/index.js'
import { RefreshSessionEntity, UserEntity } from '../user-service/index.js'
import { DatabaseService } from '../database.service.js'

const config = new AppConfigService()
config.loadEnvironmentFile()

const dataSource = new DataSource(
  DatabaseService.options(
    config,
    'central',
    [
      UserEntity,
      RefreshSessionEntity,
      TaskEntity,
      OutboxMessageEntity,
      NotificationEntity,
    ],
    ['libs/database/src/migrations/*.{ts,js}'],
  ),
)

export default dataSource
