import { OriginMiddleware } from '../../src/origin.middleware.js'

describe('OriginMiddleware', () => {
  it('should be defined', () => {
    expect(new OriginMiddleware()).toBeDefined()
  })
})
