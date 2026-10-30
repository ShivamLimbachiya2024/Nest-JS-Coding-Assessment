import 'dotenv/config'
import { TaskflowConfigService } from '../../../config/src/config.service.js'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import {
  RefreshSessionEntity,
  UserEntity,
} from '../entities/user-service/index.js'

const userDataSource = new DataSource(
  DatabaseService.options(
    new TaskflowConfigService(),
    'users',
    [UserEntity, RefreshSessionEntity],
    ['libs/database/src/migrations/user-service/*.{ts,js}'],
  ),
)

export default userDataSource
