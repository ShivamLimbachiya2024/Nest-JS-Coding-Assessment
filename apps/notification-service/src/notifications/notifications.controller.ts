import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger'
import { AccessAuthGuard, CurrentPrincipal } from 'auth'
import type { AuthPrincipal } from 'auth'
import { PaginationResponse } from 'common'
import { NotificationQueryDto } from './dto/notification-query.dto.js'
import { NotificationResponseDto } from './dto/notification-response.dto.js'
import { NotificationsService } from './notifications.service.js'

@Controller('notifications')
@ApiTags('notifications')
@ApiCookieAuth('access_token')
@ApiExtraModels(NotificationResponseDto)
@UseGuards(AccessAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(NotificationResponseDto) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
          required: ['page', 'pageSize', 'total', 'totalPages'],
        },
      },
      required: ['data', 'meta'],
    },
  })
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginationResponse<NotificationResponseDto>> {
    return this.notifications.listForUser(principal.userId, query)
  }
}
