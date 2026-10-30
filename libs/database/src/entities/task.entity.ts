import { TaskStatus } from '../../../contracts/src/index.js'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ schema: 'tasks', name: 'tasks' })
@Index('tasks_status_index', ['status'])
@Index('tasks_assigned_user_id_index', ['assignedUserId'])
@Index('tasks_created_at_index', ['createdAt'])
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string

  @Column({ length: 150 })
  declare title: string

  @Column({ type: 'varchar', length: 1000, nullable: true })
  declare description: string | null

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.TODO,
  })
  declare status: TaskStatus

  @Column({ name: 'assigned_user_id', type: 'uuid' })
  declare assignedUserId: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date
}
