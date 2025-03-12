const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Configuration
const backendPath = path.join(__dirname, '../backend');
const serverUrl = process.env.SERVER_URL || 'http://localhost:8080';
const maxRetries = 30; // Maximum number of retries to check if server is up
const retryInterval = 1000; // Interval between retries in milliseconds

// Start the backend server
function startServer() {
  console.log(chalk.blue('Starting backend server...'));

  // Using spawn to run the server in a separate process
  const server = spawn('go', ['run', 'main.go'], {
    cwd: backendPath,
    stdio: 'pipe', // Pipe stdout and stderr
  });

  // Handle server output
  server.stdout.on('data', (data) => {
    console.log(chalk.green(`[SERVER]: ${data.toString().trim()}`));
  });

  server.stderr.on('data', (data) => {
    console.error(chalk.red(`[SERVER ERROR]: ${data.toString().trim()}`));
  });

  // Handle server close/error
  server.on('close', (code) => {
    console.log(chalk.yellow(`Server process exited with code ${code}`));
    process.exit(code);
  });

  server.on('error', (err) => {
    console.error(chalk.red(`Failed to start server: ${err.message}`));
    process.exit(1);
  });

  // Return the server process for cleanup
  return server;
}

// Check if the server is running
async function isServerRunning() {
  try {
    const response = await axios.get(`${serverUrl}/health`);
    const healthData = response.data;
    console.log(chalk.green(`Server is healthy: ${JSON.stringify(healthData)}`));
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Wait for the server to be ready
async function waitForServer(retries = 0) {
  if (retries >= maxRetries) {
    console.error(chalk.red('Server failed to start within the expected time.'));
    process.exit(1);
  }

  console.log(chalk.blue(`Waiting for server to be ready... (attempt ${retries + 1}/${maxRetries})`));

  const isRunning = await isServerRunning();
  if (isRunning) {
    console.log(chalk.green('Server is up and running!'));
    return true;
  }

  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, retryInterval));
  return waitForServer(retries + 1);
}

// Main function
async function main() {
  // Start the server
  const serverProcess = startServer();

  // Wait for the server to be ready
  await waitForServer();

  // Setup clean shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('Shutting down server...'));
    serverProcess.kill();
    process.exit(0);
  });

  console.log(chalk.green('Automation server is ready. Press Ctrl+C to exit.'));
}

// Run the main function
if (require.main === module) {
  main().catch(err => {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  });
} else {
  // Export functions for use in other scripts
  module.exports = {
    startServer,
    waitForServer,
  };
}
