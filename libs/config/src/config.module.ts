import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { AppConfigService } from './config.service.js'

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: process.env.ENV_FILE ?? '.env',
      isGlobal: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
