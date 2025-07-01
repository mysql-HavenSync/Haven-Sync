module.exports = {
  preset: 'react-native',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  
  // Don't ignore these node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@react-navigation|@react-native-community|react-native-vector-icons|react-native-gesture-handler)/)',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Module name mapping for assets
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.png$': 'RelativeImageStub',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'identity-obj-proxy',
  },
  
  // Setup files
  setupFiles: ['<rootDir>/jest-setup.js'],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Coverage
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
  ],
  
  // Verbose output
  verbose: true,
};