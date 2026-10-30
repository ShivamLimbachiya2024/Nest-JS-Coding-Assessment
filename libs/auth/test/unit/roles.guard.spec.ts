import { RolesGuard } from '../../src/roles.guard.js'

describe('RolesGuard', () => {
  it('should be defined', () => {
    expect(new RolesGuard()).toBeDefined()
  })
})
