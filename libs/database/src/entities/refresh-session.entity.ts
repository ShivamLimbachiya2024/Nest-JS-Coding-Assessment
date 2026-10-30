import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ schema: 'users', name: 'refresh_sessions' })
@Index('refresh_sessions_user_id_index', ['userId'])
@Index('refresh_sessions_family_id_index', ['familyId'])
@Index('refresh_sessions_token_hash_index', ['tokenHash'], { unique: true })
export class RefreshSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string

  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string

  @Column({ name: 'family_id', type: 'uuid' })
  declare familyId: string

  @Column({ name: 'token_hash', length: 64 })
  declare tokenHash: string

  @Column({ name: 'expires_at', type: 'timestamptz' })
  declare expiresAt: Date

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  declare revokedAt: Date | null

  @Column({ name: 'replaced_by_session_id', type: 'uuid', nullable: true })
  declare replacedBySessionId: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date
}
