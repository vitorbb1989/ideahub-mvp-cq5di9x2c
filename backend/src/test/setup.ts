// Global test setup file
// Runs before all tests

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
// Comment these out if you need to debug tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});
