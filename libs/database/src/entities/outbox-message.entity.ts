import {
  MessageType,
  OutboxStatus,
  TaskCompleted,
} from '../../../../contracts/src/index.js'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ schema: 'tasks', name: 'outbox_messages' })
@Index('outbox_messages_message_id_unique', ['messageId'], { unique: true })
@Index('outbox_messages_polling_index', ['status', 'availableAt', 'createdAt'])
export class OutboxMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string

  @Column({ name: 'message_id', type: 'uuid' })
  declare messageId: string

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    enumName: 'message_type',
  })
  declare messageType: MessageType.TASK_COMPLETED

  @Column({ name: 'aggregate_id', type: 'uuid' })
  declare aggregateId: string

  @Column({ type: 'jsonb' })
  declare payload: TaskCompleted

  @Column({ default: 0 })
  declare attempts: number

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    enumName: 'outbox_status',
    default: OutboxStatus.PENDING,
  })
  declare status: OutboxStatus

  @Column({ name: 'available_at', type: 'timestamptz' })
  declare availableAt: Date

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  declare occurredAt: Date

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  declare publishedAt: Date | null

  @Column({
    name: 'last_error_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  declare lastErrorCode: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date
}
