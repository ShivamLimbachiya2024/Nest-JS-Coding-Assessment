import { Reflector } from '@nestjs/core'
import { UserRole } from '@taskflow/contracts'

export const Roles = Reflector.createDecorator<readonly UserRole[]>()
