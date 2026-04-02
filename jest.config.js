module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^uuid$': '<rootDir>/__tests__/mocks/uuid.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/mocks/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
