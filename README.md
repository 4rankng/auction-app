# Auction App Technical Specification

The Auction App is a single-page application (SPA) built with **React.js** and styled using **Bootstrap**. It manages auction workflows, including bidder management, live bidding, and auctioneer administration. Data persistence is handled via **local storage**, ensuring offline functionality.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Core Features](#core-features)
3. [Auction Workflow](#auction-workflow)
4. [Component Structure](#component-structure)
5. [State Management](#state-management)
6. [Custom Hooks](#custom-hooks)
7. [Responsive Design](#responsive-design)
8. [Error Handling](#error-handling)

---

## 1. Technology Stack

- **Frontend Framework:** React.js
- **Styling:** Bootstrap
- **State Management:** Context API and Zustand
- **Data Persistence:** Local Storage
- **Type Checking:** TypeScript
- **Build Tool:** Vite
- **Testing:** Jest and React Testing Library

---

## 2. Core Features

### 2.1 Setup Page
- Import bidders from an Excel file.
- Configure auction details (title, description, starting price, bid increment, duration).
- Manage bidders (add, edit, delete).
- Validate auction setup before starting.

### 2.2 Bid Page
- Display live auction details (current price, bid increment, participants).
- Allow participants to place bids.
- Maintain a real-time auction history.
- End auction manually.

### 2.3 Auctioneer Management
- Add, edit, and delete auctioneers.
- Integrate auctioneer details into the auction setup.

### 2.4 Popup Auction Info Page
- Display auction details in a separate popup.
- Synchronize timer and bid data with the Bid Page.
- Export auction results to an Excel file.

---

## 3. Auction Workflow

### 3.1 Setup Phase
1. **Import Bidders:** Upload an Excel file containing bidder details.
2. **Configure Auction:** Provide auction title, description, starting price, bid increment, and duration.
3. **Validate Setup:** Ensure all required fields are filled and at least two bidders are present.
4. **Start Auction:** Transition to the Bid Page with the configured details.

### 3.2 Bidding Phase
1. **Live Updates:** Display current price, bid increment, and participant count.
2. **Place Bids:** Allow participants to place bids higher than the current price.
3. **Auction History:** Log each bid with participant details, amount, and timestamp.
4. **End Auction:** Manually end the auction to finalize results.

### 3.3 Post-Auction Phase
1. **Export Results:** Generate an Excel file with auction details, including:
   - Auctioneer name
   - Winner name
   - Winning price
   - Total bids
   - Bid history
2. **Review History:** Access past auctions and their results.

---

## 4. Component Structure

### 4.1 Directory Layout
```
src/
├── components/
│   ├── BidPage/
│   │   ├── AuctionHeader/
│   │   ├── BidControls/
│   │   ├── BidderGrid/
│   │   ├── HistoryTable/
│   │   └── TimerDisplay/
│   ├── AuctioneerManagement/
│   └── Shared/
├── hooks/
│   ├── useAuction.ts
│   ├── useBidActions.ts
│   ├── useTimerLogic.ts
│   └── useAuctionPopup.ts
├── pages/
│   ├── SetupPage.tsx
│   ├── BidPage.tsx
│   ├── AuctioneerManagement.tsx
│   └── AuctionHistory.tsx
├── stores/
│   ├── auctionStore.ts
│   └── auctionThunks.ts
└── utils/
    ├── bidFormatters.ts
    └── exportService.ts
```

### 4.2 Key Components
- **AuctionHeader:** Displays auction title, status, and end button.
- **BidControls:** Manages bidder selection, bid input, and timer.
- **BidderGrid:** Displays participants and their statuses.
- **HistoryTable:** Shows auction history in a sortable table.
- **TimerDisplay:** Handles countdown timer logic.

---

## 5. State Management

### 5.1 Context API
- Shared state for auction data (e.g., current price, selected bidder).
- Functions to update state (e.g., place bid, cancel bid).

### 5.2 Zustand
- Lightweight state management for global auction state.
- Handles actions like fetching auction data, placing bids, and ending auctions.

---

## 6. Custom Hooks

### 6.1 `useAuction`
- Manages auction data (bidders, bids, settings).
- Provides functions to refresh data, place bids, and end auctions.

### 6.2 `useBidActions`
- Encapsulates logic for placing and canceling bids.
- Handles error notifications and state updates.

### 6.3 `useTimerLogic`
- Manages countdown timer for bids.
- Provides functions to start, pause, and reset the timer.

### 6.4 `useAuctionPopup`
- Synchronizes data between the Bid Page and the popup.
- Handles popup initialization and updates.

---

## 7. Responsive Design

- **Breakpoints:** Optimized for screens ≥768px and smaller devices.
- **Adjustments:**
  - Stack auction details vertically on smaller screens.
  - Ensure critical actions (e.g., end auction) remain accessible.

---

## 8. Error Handling

- **Validation Errors:** Display toast messages for missing or invalid inputs.
- **Network Errors:** Retry failed requests and show error notifications.
- **Fallbacks:** Provide default values or placeholders for missing data.

---

## 9. Future Enhancements

- **Real-Time Updates:** Integrate WebSocket for live bid updates.
- **User Authentication:** Add login functionality for auctioneers and participants.
- **Analytics Dashboard:** Provide insights into auction performance.
