import { config as loadEnvironment } from 'dotenv'
import { AppConfigService } from '../../../config/src/config.service.js'
import { DataSource } from 'typeorm'
import { NotificationEntity } from '../notification-service/index.js'
import { OutboxMessageEntity, TaskEntity } from '../task-service/index.js'
import { RefreshSessionEntity, UserEntity } from '../user-service/index.js'
import { DatabaseService } from '../database.service.js'

loadEnvironment({ path: process.env.ENV_FILE ?? '.env' })

const dataSource = new DataSource(
  DatabaseService.options(
    new AppConfigService(),
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
