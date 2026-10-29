import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ schema: 'notifications', name: 'notifications' })
@Index('notifications_source_message_id_unique', ['sourceMessageId'], {
  unique: true,
})
@Index('notifications_user_created_at_index', ['userId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string

  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string

  @Column({ length: 500 })
  declare message: string

  @Column({ name: 'is_read', default: false })
  declare isRead: boolean

  @Column({ name: 'source_message_id', type: 'uuid' })
  declare sourceMessageId: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date
}
