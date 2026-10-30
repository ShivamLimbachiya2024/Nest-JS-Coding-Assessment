import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import { AccessAuthGuard, CurrentPrincipal } from '@taskflow/auth'
import type { AuthPrincipal } from '@taskflow/auth'
import { PaginationResponse } from '@taskflow/common'
import { NotificationQueryDto } from './dto/notification-query.dto.js'
import { NotificationResponseDto } from './dto/notification-response.dto.js'
import { NotificationsService } from './notifications.service.js'

@Controller('notifications')
@ApiTags('notifications')
@ApiCookieAuth('taskflow_access_token')
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
