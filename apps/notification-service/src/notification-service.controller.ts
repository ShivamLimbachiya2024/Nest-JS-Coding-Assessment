import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { NotificationServiceService } from './notification-service.service.js'

@Controller('health')
@ApiExcludeController()
export class NotificationServiceController {
  constructor(
    private readonly notificationServiceService: NotificationServiceService,
  ) {}

  @Get('live')
  live(): Readonly<Record<string, string>> {
    return this.notificationServiceService.live()
  }

  @Get('ready')
  ready(): Promise<Readonly<Record<string, string>>> {
    return this.notificationServiceService.ready()
  }
}
