import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationResponse } from 'common'
import { NotificationEntity } from 'database/notification-service'
import map from 'lodash/map.js'
import { Repository } from 'typeorm'
import { NotificationQueryDto } from './dto/notification-query.dto.js'
import { NotificationResponseDto } from './dto/notification-response.dto.js'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async listForUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginationResponse<NotificationResponseDto>> {
    const [notifications, total] = await this.notifications.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    })

    return {
      data: map(
        notifications,
        (notification) => new NotificationResponseDto(notification),
      ),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }
}
