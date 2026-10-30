import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import { AccessAuthGuard, CurrentPrincipal } from 'auth'
import type { AuthPrincipal } from 'auth'
import { PaginationResponse } from 'common'
import { NotificationQueryDto } from './dto/notification-query.dto.js'
import { NotificationResponseDto } from './dto/notification-response.dto.js'
import { NotificationsService } from './notifications.service.js'

@Controller('notifications')
@ApiTags('notifications')
@ApiCookieAuth('access_token')
@UseGuards(AccessAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginationResponse<NotificationResponseDto>> {
    return this.notifications.listForUser(principal.userId, query)
  }
}
