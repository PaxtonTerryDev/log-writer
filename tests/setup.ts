// Jest setup file for global test configuration

// Mock console methods to capture output in tests
export const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset console mocks
  Object.keys(mockConsole).forEach(key => {
    (mockConsole as any)[key].mockClear();
  });
});

// Export utilities for tests
export { originalConsole };