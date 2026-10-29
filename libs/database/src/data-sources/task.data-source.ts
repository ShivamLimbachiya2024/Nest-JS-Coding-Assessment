import 'dotenv/config'
import { TaskflowConfigService } from '@taskflow/config'
import { DataSource } from 'typeorm'
import { DatabaseService } from '../database.service.js'
import { OutboxMessageEntity, TaskEntity } from '../entities/task-service/index.js'

export const taskDataSource = new DataSource(
  DatabaseService.options(
    new TaskflowConfigService(),
    'tasks',
    [TaskEntity, OutboxMessageEntity],
    ['libs/database/src/migrations/task-service/*.{ts,js}'],
  ),
)

export default taskDataSource
