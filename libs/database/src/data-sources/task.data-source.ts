import 'dotenv/config'
import { AppConfigService } from '../../../config/src/config.service.js'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import {
  OutboxMessageEntity,
  TaskEntity,
} from '../entities/task-service/index.js'

const taskDataSource = new DataSource(
  DatabaseService.options(
    new AppConfigService(),
    'tasks',
    [TaskEntity, OutboxMessageEntity],
    ['libs/database/src/migrations/task-service/*.{ts,js}'],
  ),
)

export default taskDataSource
