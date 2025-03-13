# Auction System - React Frontend

A modern React-based frontend for an auction system. This application allows users to create and manage auctions, add bidders, place bids, and view auction results.

## Features

- Create and manage multiple auctions
- Add and manage bidders
- Real-time bidding interface
- Auction timer with automatic completion
- Detailed auction results
- Responsive design for all devices
- CSV import for bidders
- Customizable settings

## Technology Stack

- React 18
- TypeScript
- React Router for navigation
- TailwindCSS for styling
- React Hook Form for form handling
- LocalStorage for data persistence

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the Application

```bash
npm start
# or
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
# or
yarn build
```

## Usage

1. **Home Page**: View all auctions and their status
2. **Setup Page**: Create new auctions and add bidders
3. **Bid Page**: Place bids during an active auction
4. **Result Page**: View the results of completed auctions

## Data Storage

The application uses localStorage for data persistence. All auction data, bidders, bids, and settings are stored locally in the browser.

## License

This project is licensed under the MIT License.
