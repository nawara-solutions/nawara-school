// Shared Jest preset for NestJS services (ts-jest, Node test environment).
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
};
