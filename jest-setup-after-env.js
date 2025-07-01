// Set NODE_ENV to test if not already set
process.env.NODE_ENV = 'test';

// Mock NativeWind styles
jest.mock('nativewind', () => ({}));

// Additional test environment setup
global.__TEST__ = true;