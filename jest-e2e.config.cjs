const base = require('./jest.config.cjs')

module.exports = {
  ...base,
  roots: ['<rootDir>/apps'],
  testRegex: '.*\\.e2e-spec\\.ts$',
}
