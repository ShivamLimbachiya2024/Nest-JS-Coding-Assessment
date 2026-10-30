import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule as SharedAuthModule } from 'auth'
import { CommonModule } from 'common'
import { AppConfigModule, AppConfigService } from 'config'
import { ContractsModule } from 'contracts'
import { DatabaseService } from 'database'
import { RefreshSessionEntity, UserEntity } from 'database/user-service'
import { AppLoggerModule } from 'logger'
import { RabbitmqModule } from 'rabbitmq'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthModule } from './auth/auth.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    CommonModule,
    ContractsModule,
    SharedAuthModule,
    RabbitmqModule,
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
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
