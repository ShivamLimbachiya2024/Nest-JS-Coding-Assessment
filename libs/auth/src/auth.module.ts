import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TaskflowConfigModule } from '@taskflow/config'
import { AccessAuthGuard } from './access-auth.guard.js'
import { AuthService } from './auth.service.js'
import { RolesGuard } from './roles.guard.js'

@Global()
@Module({
  imports: [TaskflowConfigModule, JwtModule.register({})],
  providers: [AccessAuthGuard, AuthService, RolesGuard],
  exports: [AccessAuthGuard, AuthService, JwtModule, RolesGuard],
})
export class AuthModule {}
