import { CorrelationMiddleware } from './correlation.middleware.js'

describe('CorrelationMiddleware', () => {
  it('should be defined', () => {
    expect(new CorrelationMiddleware()).toBeDefined()
  })
})
