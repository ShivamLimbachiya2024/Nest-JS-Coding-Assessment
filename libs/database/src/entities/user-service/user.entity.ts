import { UserRole } from '@taskflow/contracts'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ schema: 'users', name: 'users' })
@Index('users_email_unique', ['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string

  @Column({ length: 100 })
  declare name: string

  @Column({ length: 320 })
  declare email: string

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  declare role: UserRole

  @Column({ name: 'password_hash', select: false })
  declare passwordHash: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date
}
