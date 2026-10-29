import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractsModule } from '@taskflow/contracts'
import { UserEntity } from '@taskflow/database/user-service'
import { RabbitmqModule } from '@taskflow/rabbitmq'
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
