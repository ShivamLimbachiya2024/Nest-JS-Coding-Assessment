import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractsModule } from 'contracts'
import { OutboxMessageEntity } from 'database/task-service'
import { RabbitmqModule } from 'rabbitmq'
import { OutboxPublisherService } from './outbox-publisher.service.js'

@Module({
  imports: [
    ContractsModule,
    RabbitmqModule,
    TypeOrmModule.forFeature([OutboxMessageEntity]),
  ],
  providers: [OutboxPublisherService],
  exports: [OutboxPublisherService],
})
export class OutboxModule {}
