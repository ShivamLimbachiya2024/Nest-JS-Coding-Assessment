const base = require('./jest.config.cjs')

module.exports = {
  ...base,
  roots: ['<rootDir>/apps'],
  testMatch: ['**/*.e2e-spec.ts'],
}
