import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { TaskServiceService } from './task-service.service.js'

@Controller('health')
@ApiExcludeController()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @Get('live')
  live(): Readonly<Record<string, string>> {
    return this.taskServiceService.live()
  }

  @Get('ready')
  ready(): Readonly<Record<string, string>> {
    return this.taskServiceService.ready()
  }
}
