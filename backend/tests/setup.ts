// Test setup file for Jest
// Node types are provided by ts-jest configuration; no need to import here

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: () => {},
  log: () => {},
  error: () => {},
};
