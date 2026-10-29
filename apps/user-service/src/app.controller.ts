import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { AppService } from './app.service.js'

@Controller('health')
@ApiExcludeController()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('live')
  live(): Readonly<Record<string, string>> {
    return this.appService.live()
  }

  @Get('ready')
  ready(): Readonly<Record<string, string>> {
    return this.appService.ready()
  }
}
