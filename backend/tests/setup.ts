// Test setup file for Jest

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: () => {},
  log: () => {},
  error: () => {},
};
