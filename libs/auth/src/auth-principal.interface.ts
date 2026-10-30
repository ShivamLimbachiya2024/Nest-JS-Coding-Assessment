import { UserRole } from 'contracts'

export interface AuthPrincipal {
  readonly userId: string
  readonly email: string
  readonly role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      principal?: AuthPrincipal
    }
  }
}
