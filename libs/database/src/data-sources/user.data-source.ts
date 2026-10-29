import 'dotenv/config'
import { TaskflowConfigService } from '@taskflow/config'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import { RefreshSessionEntity, UserEntity } from '../entities/user-service/index.js'

export const userDataSource = new DataSource(
  DatabaseService.options(
    new TaskflowConfigService(),
    'users',
    [UserEntity, RefreshSessionEntity],
    ['libs/database/src/migrations/user-service/*.{ts,js}'],
  ),
)

export default userDataSource
