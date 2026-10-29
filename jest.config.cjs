module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['apps/**/*.ts', 'libs/**/*.ts', '!**/*.module.ts', '!**/main.ts', '!**/worker.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@taskflow/(.*)$': '<rootDir>/libs/$1/src',
  },
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
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
          type: 'commonjs',
        },
      },
    ],
  },
}
