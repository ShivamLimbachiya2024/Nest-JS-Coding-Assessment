import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractsModule } from 'contracts'
import { UserEntity } from 'database/user-service'
import { RabbitmqModule } from 'rabbitmq'
import { UserExistenceHandler } from './user-existence-handler.js'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'

@Module({
  imports: [
    ContractsModule,
    RabbitmqModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserExistenceHandler],
  exports: [UserExistenceHandler, UsersService],
})
export class UsersModule {}
