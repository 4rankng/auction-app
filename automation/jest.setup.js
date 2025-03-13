// This file is used to configure Jest and make globals available
// It's referenced in the package.json "jest" config section

// Make Jest globals explicitly available
global.describe = describe;
global.test = test;
global.it = it;
global.expect = expect;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Increase timeout for all tests
jest.setTimeout(30000);

// Ensure console logs don't break Jest after tests
// This is necessary for handling server output after tests complete
afterAll(() => {
  // Silence console to prevent "Cannot log after tests are done" errors
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Check if the log contains server output markers and silence them after tests
    if (args.length > 0 &&
        (typeof args[0] === 'string' &&
         (args[0].includes('[SERVER]') ||
          args[0].includes('[Backend]') ||
          args[0].includes('[Frontend]')))) {
      return;
    }
    return originalConsoleLog(...args);
  };
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
