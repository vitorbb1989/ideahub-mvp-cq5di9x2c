/**
 * E2E Test Setup
 *
 * This file configures the test environment for end-to-end tests.
 * It runs before all tests and sets up global configuration.
 */

// Increase timeout for E2E tests as they involve real HTTP calls
jest.setTimeout(30000);

// Suppress console output during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests';
process.env.JWT_EXPIRES_IN = '15m';

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here if needed
  await new Promise((resolve) => setTimeout(resolve, 500));
});
