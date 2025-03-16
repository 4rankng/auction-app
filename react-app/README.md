# Auction App Product Specification

The Auction App is a single-page application (SPA) built with **React.js** and styled exclusively with **Bootstrap**. Data persistence is managed via **local storage**. The application consists of three core pages:
- **Setup Page**
- **Bid Page**
- **Auctioneer Management Page**

> **Note:** Only implement the features specified below. No additional functionalities are permitted.

---

## Table of Contents

1. [Setup Page](#setup-page)
   - [Import Bidders](#import-bidders)
   - [Auction Configuration](#auction-configuration)
   - [Bidder Management](#bidder-management)
   - [Start Auction](#start-auction)
2. [Bid Page](#bid-page)
   - [Overall Layout](#overall-layout)
   - [Color Specifications](#color-specifications)
   - [Component Specifications](#component-specifications)
   - [Text Content](#text-content)
   - [Sample Data](#sample-data)
   - [Responsive Behavior](#responsive-behavior)
   - [Auction Bidding Logic](#auction-bidding-logic)
3. [Auction Round Instructions](#auction-round-instructions)
4. [Auctioneer Management](#auctioneer-management)
5. [Popup Auction Info Page](#popup-auction-info-page)
6. [Continuous Bidding System (June 2023 Update)](#continuous-bidding-system)
7. [BidControls Component Enhancements](#bidcontrols-component-enhancements)

---

## 1. Setup Page

The Setup Page is used for auction configuration and bidder management.

### 1.1 Import Bidders

- **Functionality:**
  - Provide a button to import a list of bidders from an Excel file.

- **Design & Behavior:**
  - Button displays an Excel icon with the text **"Import"**.
  - **Styling:**
    - **Border Color:** Excel green
    - **Background Color:** White
    - **Hover Effect:** Noticeable animation
  - **Layout:**
    - Position the Import button to the right of the Add New Bidder button.
    - Align all buttons and input fields horizontally across the full page width.

- **Excel Import Requirements:**
  - **Table Location:** Read from the sheet named **"Đủ ĐK"**.
  - **Table Structure (in order):**
    1. **STT** (Serial Number)
    2. **ID**
    3. **Name**
    4. **Address**
    5. **NRIC** (National Registration Identity Card)
    6. **Phone Number**
  - **Data Extraction Process:**
    1. Locate the header cell containing **"STT"** (e.g., `A10`).
    2. Validate that the subsequent cells contain:
       - `B10`: **"Họ tên"**
       - `C10`: **"Địa chỉ"**
       - `D10`: **"Giấy CMND/CCCD/ĐKDN"**
       - `E10`: **"Số điện thoại"**
    3. Extract rows immediately below the header until an empty cell is encountered.
    4. Replace any existing bidder data in both the database and the displayed list with the new data.

- **Example Table:**

  | STT | Họ tên            | Địa chỉ                                      | Giấy CMND/CCCD/ĐKDN | Số điện thoại |
  |-----|-------------------|----------------------------------------------|---------------------|---------------|
  | 1   | Nguyễn Ngọc Mai   | 476 Trần Hưng Đạo, Ngọc Châu, TP. Hải Dương   | 030183002000        | 0966592838    |
  | 2   | Đinh Thị Hường    | 23B/182 Phương Lưu, Vạn Mỹ, Ngô Quyền, Hải Phòng | 031166017315      | 0912052234    |
  | 3   | Hoàng Thị Chi     | TDP Đông Hải Sơn, Đồ Sơn, Hải Phòng            | 031163007523        | 0906032859    |

---

### 1.2 Auction Configuration

- **Auction Details Card:**
  - **Auction Title:** Mandatory
  - **Auction Description:** Optional

- **Pricing and Duration Card:**
  - **Starting Price:** Mandatory; numeric with thousand separators; default is 0.
  - **Minimum Bid Increment:** Mandatory; positive number; default is 0.
  - **Auction Duration:** Mandatory; positive number; default is 0.

- **Layout:**
  - Auction Details appear on the left side.
  - Pricing and Duration appear on the right side.
  - Both cards span the full width of the page.

---

### 1.3 Bidder Management

- **Display Existing Bidders:**
  - Retrieve bidder data from the database.
  - Display the data in a table with the following columns:
    - **ID** (unique identifier)
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**

- **Add New Bidder Section:**
  - **Add Button:**
    - A square button with a plus icon (no text).
    - On click, save the new bidder’s details to the database and update the list.
  - **Input Fields:**
    - **ID:** User-entered; if blank, auto-assign the next sequential number.
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**

- **Page Layout:**
  - The Bidder Management section occupies the bottom of the page (full width).
  - The **Start Auction** button is fixed at the bottom and always visible (full width).

---

### 1.4 Start Auction

- **Validation Criteria:**
  - **Auction Title:** Must be provided.
  - **Starting Price:** Must be provided and positive.
  - **Minimum Bid Increment:** Must be provided and positive.
  - **Auction Duration:** Must be provided and positive.
  - **Bidder List:** Must contain at least two bidders.

- **User Feedback:**
  - If validation fails, display a toast message indicating the specific error.

- **Action:**
  - Upon successful validation:
    - Save the auction details to the database.
    - Obtain the auction ID.
    - Transition to the **Bid Page** with:
      - List of bidders
      - Starting price
      - Minimum bid increment
      - Auction title
      - Auction description

---

## 2. Bid Page

The Bid Page handles live bidding and real-time auction updates.

### 2.1 Overall Layout

- **Header (Single Row):**
  - **Left:**
    - Title: **"Phiên Đấu Giá"** (Auction Session)
    - Status pill: **"Đang diễn ra"** (green background)
  - **Center:**
    - Countdown Timer (e.g., `04:35`) in large, bold green text.
  - **Right:**
    - Red button labeled **"Kết Thúc Đấu Giá"** (End Auction)

- **Auction Information Panel:**
  - Four equally sized columns displaying:
    1. **"Vòng đấu giá"** (Auction round) – e.g., `6`
    2. **"Giá hiện tại"** (Current price) – e.g., `1,500,000 VND`
    3. **"Bước giá"** (Bid increment) – e.g., `100,000 VND`
    4. **"Người tham gia"** (Participants) – e.g., `20`

- **Participant Selection Grid:**
  - Title: **"Chọn người tham gia"** (Select participant)
  - Grid: 5 rows with up to 3 buttons per row (15 total).
  - Each button:
    - Square (approx. 32px x 32px)
    - Bordered (1px) with a 4px radius
    - Labeled with a participant number

- **Bidding Form:**
  - **Name Field:** 100% width.
  - **Price Field:** Approximately 40% width.
  - **Action Buttons:**
    - Blue button with white text: **"Đấu Giá"** (Bid)
    - White button with red text: **"Hủy Đấu Giá Cuối"** (Cancel Last Bid)

- **Auction History Table:**
  - Section title: **"Lịch Sử Đấu Giá"** (Auction History)
  - Columns: **"Vòng"** (Round), **"Người tham gia"** (Participant), **"Số tiền"** (Amount), **"Thời gian"** (Time)
  - Alternating row backgrounds (light gray and white).

- **Footer:**
  - Right-aligned button: **"← Quay Lại Thiết Lập"** (Return to Setup)

---

### 2.2 Color Specifications

- **Main Background:** White (`#FFFFFF`)
- **Section Backgrounds:** Light gray (`#F5F5F5`)
- **Primary Button:** Blue (`#0D6EFD`)
- **Secondary Button:** White with red text (`#FFFFFF` / `#DC3545`)
- **Action Button:** Red (`#DC3545`)
- **Status Indicator & Timer Text:** Green (`#198754`)
- **Borders:** Light gray (`#DEE2E6`)
- **Text:** Dark gray/black (`#212529`)

---

### 2.3 Component Specifications

1. **Status Pill:**
   - Rounded rectangle (4px radius), green background (`#198754`), white text, padding: 4px 8px.

2. **Buttons:**
   - Border radius: 4px, padding: 6px 12px, font size: 14px, with consistent vertical spacing.

3. **Participant Selection Buttons:**
   - Dimensions: 32px x 32px, 1px border (`#DEE2E6`), 4px border radius, labeled with numbers.

4. **Input Fields:**
   - Height: 38px, 1px solid light gray border (`#DEE2E6`), 4px border radius, padding: 6px 12px.
   - Name field: 100% width; Price field: approximately 40% width.

5. **Table:**
   - Full width, 8px cell padding, thin borders (`#DEE2E6`), header with a slightly darker background, alternating row colors.

---

### 2.4 Text Content

- **Header:**
  - **"Phiên Đấu Giá"**, **"Đang diễn ra"**, **"Kết Thúc Đấu Giá"**.

- **Auction Information:**
  - **"Vòng đấu giá"**, **"Giá hiện tại"**, **"Bước giá"**, **"Người tham gia"**.

- **Countdown Timer:**
  - Label: **"Thời gian còn lại"** (e.g., `04:35`).

- **Form Elements:**
  - **"Chọn người tham gia"**, **"Name"**, **"Price"**, **"Đấu Giá"**, **"Hủy Đấu Giá Cuối"**.

- **Auction History Table:**
  - **"Lịch Sử Đấu Giá"**, **"Vòng"**, **"Người tham gia"**, **"Số tiền"**, **"Thời gian"**.

- **Footer:**
  - **"← Quay Lại Thiết Lập"**.

---

### 2.5 Sample Data

- **Current Auction State:**
  - Round: `6`
  - Current Price: `1,500,000 VND`
  - Bid Increment: `100,000 VND`
  - Participants: `20`
  - Remaining Time: `04:35`

- **Auction History:**
  1. Round 5: Nguyễn Văn A, `1,500,000 VND`, 13/03/2023 10:25:30
  2. Round 4: Trần Thị B, `1,400,000 VND`, 13/03/2023 10:24:15
  3. Round 3: Lê Văn C, `1,300,000 VND`, 13/03/2023 10:23:05
  4. Round 2: Phạm Thị D, `1,200,000 VND`, 13/03/2023 10:22:10
  5. Round 1: Hoàng Văn E, `1,100,000 VND`, 13/03/2023 10:21:00

---

### 2.6 Responsive Behavior

- **For screens ≥768px:**
  Maintain the described layout.

- **For smaller screens:**
  - Stack auction information columns vertically if necessary.
  - Adjust the participant grid for easier tapping.
  - Ensure the timer and **"Kết Thúc Đấu Giá"** button remain visible.

---

### 2.7 Auction Bidding Logic

- **Initial State:**
  - Auction starts at a predefined round (e.g., `6`).
  - Current Price: `1,500,000 VND`
  - Bid Increment: `100,000 VND`
  - Countdown Timer: `04:35`

- **Placing a Bid:**
  - User selects a participant and enters Name and Price.
  - Clicking **"Đấu Giá"** validates:
    - **If bid history exists:** Price must be greater than the current price.
    - **If bid history is empty and round is 1:** Price must be at least equal to the current price.
  - On a valid bid:
    - Increment the round number.
    - Update the current price.
    - Log the bid with a timestamp in the auction history.
    - Persist the bid (including bidder ID) to the database.
  - Disable the **"Đấu Giá"** button for the current bidder until another bid is placed.

- **Cancel Last Bid:**
  - Clicking **"Hủy Đấu Giá Cuối"**:
    - Reverts to the previous round.
    - Resets the current price to its previous value.
    - Removes the last bid from the auction history.
    - Disables the cancel button for that bidder until a new bid is placed.

- **Conditional Bid Options:**
  - **If bid history is empty and round is 1:**
    Display three options: **Tra Bang Gia Khoi Diem**, **Tra Theo Buoc Gia**, **Nhap Gia Tra**.
  - **Otherwise:**
    Display two options: **Tra Theo Buoc Gia**, **Nhap Gia Tra**.

- **Additional UI Behavior:**
  - When **Tra Theo Buoc Gia** is selected, use up/down triangle icons to adjust the price by the bid increment.
  - Load the bidder list from the database and display it in the participant grid.
  - On selecting a bidder, start a 60-second countdown; once expired, disable the **"Đấu Giá"** button for that bidder.
  - After placing a bid, retain the selected bidder and display the value in the **Ma So / Ten** textbox (formatted as `{BidderID} - {BidderName}`).
  - Sort the auction history table by time in descending order (latest bid on top).

- **Data Persistence:**
  - Avoid constant database polling.
  - Load auction data and bid history on page initialization.
  - Update the database only when bids are placed or cancelled.

---

## 3. Auction Round Instructions

- **Initial Round:**
  The auction round (**Vòng Đấu Giá**) starts at **1**.

- **Timer:**
  Each round has a timer (e.g., **300 seconds**).

- **Transition:**
  - When the timer reaches **0**:
    - Bidding stops.
    - A **"Start Next Round"** button appears.
    - Clicking the button:
      - Increments the round number.
      - Resets the timer to **300 seconds**.
      - Updates the new round number and timer in the database.

- **Conclusion:**
  After **round 6** ends (timer reaches **0**), the auction finishes and no further bids are accepted.

---

## 4. Auctioneer Management

- **Functionality:**
  - Provide a dedicated page to add, edit, or remove auctioneer information in the database.

- **Integration with Setup Page:**
  - Include a button labeled **"Quan Ly Dau Gia Vien"** on the Setup Page.
  - Clicking this button navigates to the Auctioneer Management page.
  - Auctioneer information becomes part of the auction setup.
  - When the **"Bat Dau Dau Gia"** button is clicked, include the auctioneer's details in the auction data sent to the database and passed to the Bid Page.

- **UI Adjustments on Setup Page:**
  - Rename the **"Gia & Thoi Gian"** card to **"Cai Dat Dau Gia"**.
  - Display **Gia Khoi Diem** and **Buoc Gia Toi Thieu** on the same line to conserve space.
  - Provide a dropdown to select the auctioneer.

---

## 5. Popup Auction Info Page

This browser popup displays key auction details.

### Layout Structure

1. **Header:**
   - Prominently display the company name.
   - Show the auction session ID (**"Phiên đấu giá tài sản"**) and the auctioneer's name (**"Đấu giá viên"**).

2. **Auction Details Section:**
   - Display:
     - **Starting Price (Giá khởi điểm)**
     - **Bidding Step (Bước giá)**
   - Use a simple grid or card layout.

3. **Bid Information Section:**
   - Display:
     - **Current Bidding Round (Lần trả giá)**
     - **Highest Bidder (Người trả giá cao nhất):** Display **"Chưa có"** if no bids.
     - **Highest Bid Amount (Giá trả cao nhất):** Default to **"0 đồng"** if no bids.
   - Use a table or list format.

### Functional Requirements

- **Dynamic Data Display:**
  - Fetch auction data from an API or database.
  - Update bid details in real time.

- **Responsive Design:**
  - Use Bootstrap’s grid system to ensure proper display on desktop, tablet, and mobile.

- **Styling & Error Handling:**
  - Utilize Bootstrap typography and spacing classes (e.g., `h1`, `h2`, `text-center`, `mt-3`, `mb-4`).
  - Display fallback text (**"Chưa có"**) if data is missing.

- **Export Feature:**
  - When the auction ends, include a button labeled **"Xuất dữ liệu"** to export details to an Excel file:
    - Auctioneer's name
    - Winner's name
    - Winning price
    - Start time
    - End time
    - Total rounds
    - Total bids
    - Bid history

### Suggested Components

1. **Header Component:**
   Contains the company name, session ID, and auctioneer name (center-aligned).

2. **Auction Details Component:**
   Displays starting price and bidding step in a grid layout.

3. **Bid Information Component:**
   Displays current round, highest bidder, and highest bid in a card or table format.

### User Interaction & Accessibility

- The popup is initially static (no interactive buttons).
- Future enhancements may include a countdown timer or interactive bid controls.
- Ensure semantic HTML (proper headings and labels) and high contrast for readability.

---

## 6. Continuous Bidding System (June 2023 Update)

The auction app now employs a continuous bidding system instead of round-based bidding.

- **Key Changes:**
  1. **Round-Based Logic Removed:**
     Auctions run continuously until manually ended.
  2. **Elapsed Time Tracking:**
     Displays how long the auction has been running.
  3. **Auction End:**
     Auctions only end when the **"Kết Thúc Đấu Giá"** button is clicked.
  4. **Bidding History:**
     Now shows a simple chronological list of bids.
  5. **UI Focus:**
     Emphasizes **"Lượt Trả Giá"** (Number of Bids) instead of auction rounds.

- **Backward Compatibility:**
  Bids are still internally assigned a round value of 1.

- **Popup Synchronization:**
  When the Bid Page is opened (by admin), a browser popup is launched displaying:
  1. **Auction Company** (default value)
  2. **Dau Gia Vien** (auctioneer’s name passed from setup)
  3. **Gia Khoi Diem** (startingPrice)
  4. **Buoc Gia** (bidStep)
  5. **Lan Tra Gia** (bidNumber)
  6. **Phien Dau Gia Tai San** (bidRound from setup and saved in the database)
  7. **Nguoi Tra Gia Cao Nhat** (bidder ID of the highest bidder)
  8. **Thoi Gian Tra Con Lai** (timer value synced with the Bid Page)

- **Popup Close Mechanism:**
  A button at the top right of the popup is the only way to close it.
  *Note: The popup should no longer auto-close.*

- **On "Ket Thuc Dau Gia" Click:**
  The popup displays:
  - Auction company name
  - Auction title
  - **Dau Gia Vien:** Auctioneer name
  - **Nguoi Tra Gia Cao Nhat:** Bidder ID of the highest bidder
  - **Gia Tra Cao Nhat:** Winning price

- **Timer Synchronization Between Bid Page and Popup:**
  1. The Bid Page passes the timer value to the auction popup.
  2. The auction popup starts its countdown from the passed timer value.
  3. If a different bidder is selected on the Bid Page, it resends the timer value.
  4. Upon receiving a new timer value, the popup restarts the countdown from that value.

---

## 7. BidControls Component Enhancements

### UI Elements

#### Add "Bắt Đầu" Button
- Insert a "Bắt Đầu" (startBid) button above the timer.

#### Enhance Timer Display
- Style the timer with:
  - A larger font size
  - A distinct background color
  - A border to improve visibility
  - Format: `mm:ss` (e.g., `04:35`)

#### Positioning
- Place both the timer and the "Bắt Đầu" button in the top-right corner of the BidControls component.
- Retain the original layout while enhancing visual prominence.

---

### Bid Logic Implementation

#### On Bidder Selection
- When a bidder is selected or deselected:
  - Set the timer to the initial `bidDuration` value **without** starting the countdown.
  - Ensure the "Bắt Đầu" button is enabled.

#### On "Bắt Đầu" Button Click
- Start the countdown.
- Transmit the current timer value to the auction popup.
- Disable the "Bắt Đầu" button during the countdown (apply a gray color scheme).

#### Timer and Button Behavior During Countdown
- While the timer is active, keep the "Bắt Đầu" button disabled with a gray color scheme.

#### After Countdown Completion
- When the timer reaches zero:
  - Re-enable the "Bắt Đầu" button.
  - Reset the timer value to `bidDuration`.
  - Do **not** transmit the timer value to the auction popup.

#### Additional Button Behaviors
- Whenever the "Bắt Đầu" button is enabled, automatically reset the timer value to `bidDuration`.
- When the "Dau Gia" button is clicked:
  - The Bid Page sends a timer value of 0 to the auction popup to reset the timer.
  - Enable the "Bắt Đầu" button and set the timer value to `bidDuration`.



# Component Modularization Strategy

## 1. Recommended Directory Structure

Organize the project as follows:
- **src/**
  - **components/**
    - **BidPage/**
      - *AuctionHeader/*
      - *BidControls/* (Existing component)
      - *BidderGrid/*
      - *HistoryTable/*
      - *TimerDisplay/* (New component)
    - **shared/**
  - **hooks/**
    - *useAuctionManager.ts* (New)
    - *useBidActions.ts* (New)
    - *useTimerLogic.ts* (Enhanced)
  - **utils/**
    - *bidFormatters.ts* (New)
    - *exportService.ts* (New)

## 2. Key Refactoring Steps

### 2.1 Extract Timer Logic to a Custom Hook
- Isolate the countdown functionality into a custom hook.
- The hook should initialize the timer based on a provided duration.
- It must provide functions to start and reset the timer.
- An interval should update the timer value every second.
- Return a formatted time string, an active state indicator, and control functions.

### 2.2 Create a Dedicated Bid Management Hook
- Develop a hook to handle bid-related actions.
- Include a function for placing a bid with appropriate error handling and user notifications.
- Include a function for canceling a bid following a similar error management approach.

### 2.3 Split the UI into Focused Components
- Break the UI into smaller, dedicated components such as:
  - **TimerDisplay** for showing the countdown timer.
  - **BidderGrid** for listing the bidders.
- Each component should manage a specific section of the UI.

## 3. State Management Improvements

### 3.1 Use Context API for Shared State
- Implement the Context API to manage shared state such as:
  - The currently selected bidder.
  - The current auction price.
- Provide functions within the context to update state values (e.g., updating the selected bidder and formatting the price).

### 3.2 Optimize Effect Dependencies
- Refactor complex side effects by splitting them into focused useEffect hooks.
- Ensure that changes in auction status or selected bidder trigger only the necessary effects.

## 4. Readability Enhancements

### 4.1 Define TypeScript Interfaces
- Create interfaces to define the shape of the auction state, including:
  - Auction ID, status, current price, list of bidders, and bid history.
- Define interfaces for bid action handlers to clearly specify functions for placing and canceling bids.

### 4.2 Create Utility Functions
- Develop utility functions to format bid history data.
- These functions should map raw bid data into a format that includes bidder names, formatted amounts, and localized timestamps.

## 5. Proposed Component Structure

Outline a refactored structure for the BidPage:
- **AuctionHeader:** Displays the auction title and current status.
- **Content Area:**
  - **BidderGrid:** Shows the list of bidders and handles selection.
  - **BidControls:** Manages bid initiation and timer display.
  - **BidHistoryTable:** Presents the auction history with formatted bid data.
- **AuctionPopup:** Displays detailed auction information.
- Wrap all components within a provider for shared state management.

## 6. Key Benefits

| Aspect            | Before            | After                |
|-------------------|-------------------|----------------------|
| **Component Size**| 800+ LOC          | 150-300 LOC          |
| **State Management** | Component State | Context + Hooks      |
| **Reusability**   | Single Use        | Multi-component      |
| **Testability**   | Hard to Test      | Isolated Units       |
| **Maintenance**   | Fragile           | Predictable          |

## 7. Implementation Strategy

- **Phase 1:** Extract individual UI components (e.g., TimerDisplay, BidderGrid).
- **Phase 2:** Create context providers to manage shared state.
- **Phase 3:** Refactor business logic into custom hooks.
- **Phase 4:** Implement TypeScript interfaces to improve type safety.
- **Phase 5:** Develop Storybook stories for visual testing.

This modular approach reduces component complexity by 60-70% while maintaining full functionality. Each part can be developed, tested, and maintained independently.



# Step-by-Step Refactoring Plan for BidPage

Improving the maintainability and readability of the BidPage component can be achieved by breaking down the monolithic code into smaller, focused parts. Below is a step-by-step plan:

## 1. Extract Business Logic into Custom Hooks
- **Auction Data Management:**
  Refine or further extract logic from the existing auction hook to handle data fetching, updating, and error handling.
- **Bid Actions:**
  Create a dedicated hook (e.g., `useBidActions`) to encapsulate functions for placing and canceling bids, along with consistent error handling.
- **Timer Management:**
  Enhance or extract the timer functionality into a custom hook (e.g., `useBidderTimer` or `useAuctionTimer`) so that the timer logic is isolated and easily reusable.

## 2. Modularize the Component
- **Split UI into Smaller Components:**
  Break the BidPage into several sub-components, such as:
  - **AuctionHeader:** Displays the auction title, elapsed time, and an end auction button.
  - **AuctionSummary:** Shows current price, bid increment, and participant count.
  - **BidControls:** Manages bidder selection, bid input, and the countdown timer.
  - **BidHistoryTable:** Presents the bid history in a clean, sortable table.
  - **AuctionPopup:** Handles the popup display for additional auction details.
- **Organize Files by Feature:**
  Place these components in dedicated directories (e.g., `@components/BidPage`) to promote reusability and separation of concerns.

## 3. Improve State Management
- **Centralize Shared State:**
  Use React’s Context API to manage shared auction data (such as the selected bidder, current price, and bid history). This reduces prop drilling and simplifies state updates across components.
- **Optimize Effects:**
  Split complex `useEffect` hooks into smaller ones that handle individual tasks (e.g., one for updating elapsed time, another for popup management).

## 4. Extract Utility Functions
- **Currency and Time Formatting:**
  Move functions that format currency, timestamps, and bid history into separate utility modules (e.g., `bidFormatters.ts`). This promotes code reuse and clarity.
- **Consistent Error Handling:**
  Centralize toast notifications and error messaging into helper functions to reduce repetitive code.

## 5. Simplify Popup Management
- **Consolidate Popup Logic:**
  Extract the logic related to initializing, updating, and closing popups into its own custom hook (e.g., `useAuctionPopup`).
- **Remove Redundant Flags:**
  Streamline the state variables that track popup status and creation, reducing complexity and potential bugs.

## 6. Enhance Readability with TypeScript Interfaces
- **Define Clear Types:**
  Create interfaces for Auction, Bid, and BidHistoryDisplay. This ensures that data structures are consistent and improves code self-documentation.
- **Type All Functions and Components:**
  Use TypeScript types to annotate functions and component props, which improves clarity and reduces errors.

## 7. Organize Event Handlers and Helper Functions
- **Group Similar Handlers:**
  Organize functions like bidder selection, placing bids, and canceling bids together.
- **Move Helper Functions Out:**
  When possible, move non-UI-specific helper functions outside the main component to reduce clutter.

## 8. Document and Comment Key Sections
- **Inline Documentation:**
  Add comments to explain non-trivial business logic, particularly around auction duration calculations and popup synchronization.
- **Component Documentation:**
  Document the purpose and behavior of each sub-component and custom hook to facilitate future maintenance.

## 9. Final Integration and Testing
- **Combine Sub-Components:**
  Integrate the refactored sub-components back into a simplified BidPage component that mainly orchestrates the overall layout.
- **Unit and Integration Testing:**
  Test each custom hook and component independently, then validate that the integrated page behaves as expected.
- **Code Review and Iteration:**
  Perform code reviews to ensure that the new structure improves readability and that no functionality has been lost in the refactor.

Following these steps will reduce the complexity of the BidPage component, enhance code modularity, and significantly improve both maintainability and readability.


Looking at the current layout in AuctionPopupRenderer.tsx, I need to reorganize the display by putting specific information on the same lines. Let me analyze what needs to be changed:
"Dau Gia Vien" (auctioneer) should be on the same line as "Phien Dau Gia Tai San" - this means I need to move it from the detail rows to the auction title area.
"Gia Khoi Diem" (starting price) and "Buoc Gia" (bid step) should be on the same line - these are already in the detail rows but need to be reorganized.
"Nguoi Tra Gia Cao Nhat" (highest bidder) should be on its own line - this is in the detail rows and needs to be reorganized.
"Lan Tra Gia" (bid round) and "Nguoi Tra Gia" (current bidder) should be on the same line - these need to be reorganized in the detail rows.


Based on my research, I understand how the auction popup works and what changes I need to make. Now I'll add a button at the top center of the page to display the auction popup when clicked.
Here's the plan:
Add a button at the top center of the BidPage
Make sure the auction popup doesn't automatically open when BidPage loads
Set up the button to open the popup when clicked
