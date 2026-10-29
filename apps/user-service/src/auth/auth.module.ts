import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule as SharedAuthModule } from '@taskflow/auth'
import { RefreshSessionEntity } from '@taskflow/database/user-service'
import { UsersModule } from '../users/users.module.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

@Module({
  imports: [
    SharedAuthModule,
    TypeOrmModule.forFeature([RefreshSessionEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
