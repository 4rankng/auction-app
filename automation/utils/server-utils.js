/**
 * Server utilities for Auction App Test Automation
 *
 * This file contains shared utility functions for managing servers
 * during test automation.
 */

const axios = require('axios');
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Check if a server is running
 * @param {string} url - The URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - True if server is running, false otherwise
 */
async function isServerRunning(url, timeout = config.timeouts.defaultApiResponse) {
  try {
    const response = await axios.get(url, { timeout });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Start the frontend server
 * @returns {Promise<{process: ChildProcess, success: boolean}>} - Server process and success status
 */
async function startFrontendServer() {
  const frontendDir = path.resolve(__dirname, '../../frontend');

  if (!existsSync(frontendDir)) {
    console.error(`Frontend directory not found at ${frontendDir}`);
    return { process: null, success: false };
  }

  console.log('Starting frontend server...');
  const frontendProcess = spawn('npx', ['http-server', '.', '-p', config.ports.frontend], {
    cwd: frontendDir,
    stdio: 'pipe',
    detached: true
  });

  // Log stdout and stderr
  frontendProcess.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });

  // Wait for server to start
  let attempts = 0;
  const maxAttempts = Math.ceil(config.timeouts.serverStartup / 1000);
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await isServerRunning(config.urls.frontend.index)) {
      console.log('Frontend server started successfully.');
      return { process: frontendProcess, success: true };
    }
    attempts++;
  }

  console.error('Failed to start frontend server.');
  return { process: frontendProcess, success: false };
}

/**
 * Start the backend server
 * @returns {Promise<{process: ChildProcess, success: boolean}>} - Server process and success status
 */
async function startBackendServer() {
  const backendDir = path.resolve(__dirname, '../../backend');

  if (!existsSync(backendDir)) {
    console.error(`Backend directory not found at ${backendDir}`);
    return { process: null, success: false };
  }

  console.log('Starting backend server...');
  const backendProcess = spawn('go', ['run', '.'], {
    cwd: backendDir,
    stdio: 'pipe',
    detached: true
  });

  // Log stdout and stderr
  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  // Wait for server to start
  let attempts = 0;
  const maxAttempts = Math.ceil(config.timeouts.serverStartup / 1000);
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await isServerRunning(config.urls.backend.health)) {
      console.log('Backend server started successfully.');
      return { process: backendProcess, success: true };
    }
    attempts++;
  }

  console.error('Failed to start backend server.');
  return { process: backendProcess, success: false };
}

/**
 * Check if both frontend and backend servers are running
 * @returns {Promise<{frontendRunning: boolean, backendRunning: boolean}>} Server status
 */
async function checkServersRunning() {
  const frontendRunning = await isServerRunning(config.urls.frontend.index);
  const backendRunning = await isServerRunning(config.urls.backend.health);

  return {
    frontendRunning,
    backendRunning
  };
}

/**
 * Stop a server process
 * @param {ChildProcess} process - The server process to stop
 * @returns {Promise<void>} - Resolves when server is stopped
 */
function stopServer(process) {
  return new Promise((resolve) => {
    if (!process) {
      resolve();
      return;
    }

    // Remove all listeners to prevent logging after tests
    if (process.stdout) process.stdout.removeAllListeners();
    if (process.stderr) process.stderr.removeAllListeners();

    try {
      // Try to kill the process group first (for detached processes)
      try {
        // For detached processes
        process.kill(-process.pid);
      } catch (err) {
        // If that fails, try to kill just the process
        process.kill();
      }

      // Add a listener for process exit
      process.on('exit', () => {
        resolve();
      });

      // Safety timeout in case the exit event doesn't fire
      setTimeout(() => {
        resolve();
      }, 500);
    } catch (error) {
      console.error(`Error stopping server: ${error.message}`);
      resolve();
    }
  });
}

module.exports = {
  isServerRunning,
  startFrontendServer,
  startBackendServer,
  checkServersRunning,
  stopServer
};
