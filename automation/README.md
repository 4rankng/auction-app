# Auction App Test Automation

This directory contains automated tests for the Auction App, including API tests and UI tests.

## Project Structure

- `auction_api.test.js` - API tests for backend endpoints
- `index_page.test.js` - UI tests for frontend components
- `config.js` - Centralized configuration for all test endpoints and settings
- `run-ui-tests.js` - Script to run UI tests with automatic server management
- `utils/` - Shared utility functions used across tests
  - `server-utils.js` - Server management utilities

## Centralized Configuration

This project uses a centralized configuration system (`config.js`) to manage all endpoints and settings. This ensures consistency across tests and makes it easy to update URLs or other parameters in one place.

The configuration includes:
- Frontend and backend server URLs
- API endpoints for all operations
- Timeouts for API responses and UI tests
- Server port settings

To modify any URL or setting, update the `config.js` file instead of changing individual test files.

## Prerequisites

- Node.js (v14 or higher)
- Go (v1.16 or higher)
- npm or yarn

## Installation

Install the dependencies by running:

```bash
npm install
```

## Setting Up the Test Environment

Before running the tests, you need to ensure that both the backend and frontend servers are running:

### Start the Backend Server

```bash
cd ../backend
go run .
```

The backend server will start on port 8080 by default.

### Start the Frontend Server

```bash
cd ../frontend
npx http-server . -p 5500
```

This will serve the frontend files on port 5500.

## Running the Tests

### API Tests

To run the API tests:

```bash
npm run test:api
```

This will run the Jest tests that verify the backend API functionality.

### UI Tests

There are multiple ways to run the UI tests:

#### Option 1: Automatic setup (Recommended)

This option will automatically check if servers are running, start them if needed, run the tests, and clean up:

```bash
npm run test:ui:auto
```

#### Option 2: Manual setup

If you've already started both servers manually, you can run:

```bash
npm run test:ui
```

#### Option 3: Debug mode

To run the UI tests in debug mode (with browser visible):

```bash
npm run test:ui:debug
```

### Running all tests

To run both API and UI tests in sequence:

```bash
npm run test:all
```

This will run the API tests first, then run the UI tests with automatic server setup.

## Test Coverage

### API Tests

- API endpoint functionality
- Response correctness
- Error handling

### UI Tests

- Index page navigation
- Creation of new auctions
- Viewing auction details
- Language and formatting requirements
- Price display format

## Adding New Tests

To add new API tests, add them to the `auction_api.test.js` file.

To add new UI tests, add them to the `index_page.test.js` file or create new test files as needed.

## Troubleshooting

If you encounter issues with the tests:

1. Make sure both servers are running:
   - Backend server should be accessible at http://localhost:8080/health
   - Frontend server should be accessible at http://127.0.0.1:5500

2. Check for error messages in the terminal, which may indicate issues with server connectivity.

3. Use the `npm run test:ui:auto` command, which includes server validation and will provide helpful error messages.
