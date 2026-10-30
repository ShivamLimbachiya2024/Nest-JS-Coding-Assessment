import { Reflector } from '@nestjs/core'
import { UserRole } from 'contracts'

export const Roles = Reflector.createDecorator<readonly UserRole[]>()
