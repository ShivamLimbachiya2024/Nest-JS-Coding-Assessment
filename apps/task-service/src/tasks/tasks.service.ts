import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  ApplicationError,
  ErrorCode,
  PaginationResponse,
  RequestContext,
} from 'common'
import {
  ContractsService,
  MessageType,
  OutboxStatus,
  TaskCompleted,
  TaskStatus,
  UserExistenceRequest,
  WorkerQueue,
} from 'contracts'
import { OutboxMessageEntity, TaskEntity } from 'database/task-service'
import { StoryLogger } from 'logger'
import {
  MessageProcessingError,
  RabbitErrorCode,
  RabbitmqService,
} from 'rabbitmq'
import map from 'lodash/map.js'
import { randomUUID } from 'node:crypto'
import { DataSource, FindOptionsWhere, Repository } from 'typeorm'
import { AssignTaskDto } from './dto/assign-task.dto.js'
import { CreateTaskDto } from './dto/create-task.dto.js'
import { TaskQueryDto } from './dto/task-query.dto.js'
import { TaskResponseDto } from './dto/task-response.dto.js'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
    private readonly dataSource: DataSource,
    private readonly rabbitmq: RabbitmqService,
    private readonly contracts: ContractsService,
    private readonly context: RequestContext,
    private readonly logger: StoryLogger,
  ) {}

  async create(input: CreateTaskDto): Promise<TaskResponseDto> {
    await this.verifyAssignee(input.assignedUserId)
    const task = this.tasks.create({
      title: input.title,
      description: input.description ?? null,
      assignedUserId: input.assignedUserId,
      status: TaskStatus.TODO,
    })
    const saved = await this.tasks.save(task)
    this.logger.info(
      `Task creation committed correlationId=${this.context.correlationId} operation=create-task outcome=completed taskId=${saved.id} assignedUserId=${saved.assignedUserId}`,
    )
    return new TaskResponseDto(saved)
  }

  async list(
    query: TaskQueryDto,
  ): Promise<PaginationResponse<TaskResponseDto>> {
    const where: FindOptionsWhere<TaskEntity> = {}

    if (query.status !== undefined) {
      where.status = query.status
    }

    if (query.assignedUserId !== undefined) {
      where.assignedUserId = query.assignedUserId
    }

    const [tasks, total] = await this.tasks.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    })

    return {
      data: map(tasks, (task) => new TaskResponseDto(task)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }

  async getById(id: string): Promise<TaskResponseDto> {
    return new TaskResponseDto(await this.getEntity(id))
  }

  async updateStatus(
    id: string,
    nextStatus: TaskStatus,
  ): Promise<TaskResponseDto> {
    const updated = await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(TaskEntity)
      const outboxRepository = manager.getRepository(OutboxMessageEntity)
      const task = await taskRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      })

      if (task === null) {
        throw this.taskNotFound()
      }

      const previousStatus = task.status

      if (previousStatus === nextStatus) {
        return task
      }

      task.status = nextStatus
      const saved = await taskRepository.save(task)

      if (
        previousStatus !== TaskStatus.DONE &&
        nextStatus === TaskStatus.DONE
      ) {
        const occurredAt = new Date()
        const payload = new TaskCompleted()
        payload.taskId = saved.id
        payload.assignedUserId = saved.assignedUserId
        payload.taskTitle = saved.title
        payload.completedAt = occurredAt.toISOString()
        const outbox = outboxRepository.create({
          messageId: randomUUID(),
          messageType: MessageType.TASK_COMPLETED,
          aggregateId: saved.id,
          payload,
          attempts: 0,
          status: OutboxStatus.PENDING,
          availableAt: occurredAt,
          occurredAt,
          publishedAt: null,
          lastErrorCode: null,
        })
        await outboxRepository.save(outbox)
      }

      return saved
    })
    this.logger.info(
      `Task status transaction committed correlationId=${this.context.correlationId} operation=update-task-status outcome=completed taskId=${updated.id} status=${updated.status}`,
    )
    return new TaskResponseDto(updated)
  }

  async assign(id: string, input: AssignTaskDto): Promise<TaskResponseDto> {
    await this.verifyAssignee(input.assignedUserId)
    const task = await this.getEntity(id)
    task.assignedUserId = input.assignedUserId
    const saved = await this.tasks.save(task)
    this.logger.info(
      `Task assignment committed correlationId=${this.context.correlationId} operation=assign-task outcome=completed taskId=${saved.id} assignedUserId=${saved.assignedUserId}`,
    )
    return new TaskResponseDto(saved)
  }

  async delete(id: string): Promise<void> {
    const result = await this.tasks.delete({ id })

    if (result.affected !== 1) {
      throw this.taskNotFound()
    }

    this.logger.info(
      `Task deletion committed correlationId=${this.context.correlationId} operation=delete-task outcome=completed taskId=${id}`,
    )
  }

  private async verifyAssignee(userId: string): Promise<void> {
    const request = new UserExistenceRequest()
    request.userId = userId
    const envelope = this.contracts.createEnvelope(
      MessageType.USERS_EXISTS_REQUEST,
      'task-service',
      this.context.correlationId,
      request,
    )

    this.logger.info(
      `User verification request started correlationId=${this.context.correlationId} operation=verify-assignee outcome=started messageId=${envelope.messageId} assignedUserId=${userId}`,
    )

    try {
      const rawReply = await this.rabbitmq.request(
        WorkerQueue.USER_VERIFICATION,
        envelope,
        1_500,
      )
      const replyEnvelope = this.contracts.parseEnvelope(rawReply)

      if (replyEnvelope.messageType !== MessageType.USERS_EXISTS_RESPONSE) {
        throw new Error('Unexpected user verification reply type')
      }

      const reply = this.contracts.parseUserExistenceResponse(
        replyEnvelope.payload,
      )

      if (!reply.exists || reply.userId !== userId) {
        throw new ApplicationError(
          ErrorCode.ASSIGNEE_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
          'Assigned user does not exist',
        )
      }
    } catch (error: unknown) {
      if (error instanceof ApplicationError) {
        throw error
      }

      if (
        error instanceof MessageProcessingError &&
        error.code === RabbitErrorCode.REQUEST_TIMEOUT
      ) {
        throw new ApplicationError(
          ErrorCode.USER_VERIFICATION_TIMEOUT,
          HttpStatus.GATEWAY_TIMEOUT,
          'User verification timed out',
        )
      }

      throw new ApplicationError(
        ErrorCode.USER_SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'User verification service is unavailable',
      )
    }
  }

  private async getEntity(id: string): Promise<TaskEntity> {
    const task = await this.tasks.findOneBy({ id })

    if (task === null) {
      throw this.taskNotFound()
    }

    return task
  }

  private taskNotFound(): ApplicationError {
    return new ApplicationError(
      ErrorCode.TASK_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      'Task was not found',
    )
  }
}
