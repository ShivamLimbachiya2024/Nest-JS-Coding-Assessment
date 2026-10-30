module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['apps/**/*.ts', 'libs/**/*.ts', '!**/*.module.ts', '!**/main.ts', '!**/worker.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^database/(user-service|task-service|notification-service)$':
      '<rootDir>/libs/database/src/entities/$1/index.ts',
    '^(auth|common|config|contracts|database|logger|rabbitmq)$':
      '<rootDir>/libs/$1/src/index.ts',
    '^(auth|common|config|contracts|database|logger|rabbitmq)/(.*)$':
      '<rootDir>/libs/$1/src/$2',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
}
