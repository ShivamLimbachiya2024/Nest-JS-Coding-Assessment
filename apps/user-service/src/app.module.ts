import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule as SharedAuthModule } from '@taskflow/auth'
import { CommonModule } from '@taskflow/common'
import { TaskflowConfigModule, TaskflowConfigService } from '@taskflow/config'
import { ContractsModule } from '@taskflow/contracts'
import { DatabaseService } from '@taskflow/database'
import {
  RefreshSessionEntity,
  UserEntity,
} from '@taskflow/database/user-service'
import { TaskflowLoggerModule } from '@taskflow/logger'
import { RabbitmqModule } from '@taskflow/rabbitmq'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthModule } from './auth/auth.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    TaskflowConfigModule,
    TaskflowLoggerModule,
    CommonModule,
    ContractsModule,
    SharedAuthModule,
    RabbitmqModule,
    TypeOrmModule.forRootAsync({
      inject: [TaskflowConfigService],
      useFactory: (config: TaskflowConfigService) =>
        DatabaseService.options(
          config,
          'users',
          [UserEntity, RefreshSessionEntity],
          [],
        ),
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
