#!/usr/bin/env node

/**
 * Script to run UI tests with server check
 *
 * This script:
 * 1. Checks if frontend and backend servers are running
 * 2. Starts them if they're not running
 * 3. Runs the UI tests
 */

const { spawn } = require('child_process');
const path = require('path');
const config = require('./config');
const {
  isServerRunning,
  startFrontendServer,
  startBackendServer,
  checkServersRunning,
  stopServer
} = require('./utils/server-utils');

// Server process references
let frontendProcess = null;
let backendProcess = null;

/**
 * Run the UI tests
 */
async function runTests() {
  console.log('Running UI tests...');
  const testProcess = spawn('npx', ['playwright', 'test', 'index_page.test.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  return new Promise((resolve) => {
    testProcess.on('close', (code) => {
      console.log(`Tests exited with code ${code}`);
      resolve(code);
    });
  });
}

/**
 * Cleanup function to stop servers started by this script
 */
async function cleanup() {
  console.log('Cleaning up...');

  if (frontendProcess) {
    await stopServer(frontendProcess);
    console.log('Frontend server stopped.');
  }

  if (backendProcess) {
    await stopServer(backendProcess);
    console.log('Backend server stopped.');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Checking if servers are running...');

    // Check if servers are running
    const { frontendRunning, backendRunning } = await checkServersRunning();

    console.log(`Frontend server running: ${frontendRunning}`);
    console.log(`Backend server running: ${backendRunning}`);

    // Start servers if needed
    let startedFrontend = false;
    let startedBackend = false;

    if (!frontendRunning) {
      const { process, success } = await startFrontendServer();
      frontendProcess = process;
      startedFrontend = success;

      if (!startedFrontend) {
        console.error('Failed to start frontend server. Exiting.');
        process.exit(1);
      }
    }

    if (!backendRunning) {
      const { process, success } = await startBackendServer();
      backendProcess = process;
      startedBackend = success;

      if (!startedBackend) {
        console.error('Failed to start backend server. Exiting.');
        process.exit(1);
      }
    }

    // Run tests
    const exitCode = await runTests();

    // Stop servers only if we started them
    if (startedFrontend || startedBackend) {
      await cleanup();
    }

    process.exit(exitCode);
  } catch (error) {
    console.error('An error occurred:', error);
    await cleanup();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Process interrupted.');
  await cleanup();
  process.exit(0);
});

// Run the main function
main();
