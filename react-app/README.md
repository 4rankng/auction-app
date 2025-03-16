# Auction App Product Specification

The Auction App is a robust single-page application built with **React.js** and styled exclusively using **Bootstrap**. Data is persistently stored in local storage, and the app strictly adheres to the features outlined below—no extraneous functionality will be implemented.

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

The Setup Page is the command center for auction configuration and bidder management.

### 1.1 Import Bidders

- **Functionality:**
  A dedicated button imports a list of bidders from an Excel file.

- **Design & Behavior:**
  The button features an Excel icon with the label **"Import"**.
  - **Styling:**
    - **Border:** Excel green
    - **Background:** White
    - **Hover Effect:** Smooth and noticeable animation
  - **Layout:**
    The Import button is positioned to the right of the Add New Bidder button, with all buttons and input fields aligned horizontally across the page.

- **Excel Import Requirements:**
  Data is read from the sheet named **"Đủ ĐK"** in the following column order:
  1. **STT** (Serial Number)
  2. **ID**
  3. **Name**
  4. **Address**
  5. **NRIC** (National Registration Identity Card)
  6. **Phone Number**

  **Data Extraction Process:**
  - Locate the header cell containing **"STT"** (e.g., `A10`).
  - Validate that the following cells contain:
    - `B10`: **"Họ tên"**
    - `C10`: **"Địa chỉ"**
    - `D10`: **"Giấy CMND/CCCD/ĐKDN"**
    - `E10`: **"Số điện thoại"**
  - Extract rows immediately following the header until an empty cell is encountered.
  - Replace any existing bidder data in the database and on screen with the newly imported data.

**Example Table:**

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
  - **Starting Price:** Mandatory; must be numeric with thousand separators; default is 0.
  - **Minimum Bid Increment:** Mandatory; must be a positive number; default is 0.
  - **Auction Duration:** Mandatory; must be a positive number; default is 0.

- **Layout:**
  The Auction Details appear on the left side, while the Pricing and Duration card is positioned on the right. Both span the full width of the page.

---

### 1.3 Bidder Management

- **Displaying Existing Bidders:**
  Retrieve bidder data from the database and display it in a table with the following columns:
  - **ID** (unique identifier)
  - **Name**
  - **NRIC**
  - **Issuing Authority**
  - **Address**

- **Add New Bidder Section:**
  - **Add Button:**
    A square button with a plus icon (no text). On click, it saves the new bidder’s details to the database and updates the list.
  - **Input Fields:**
    - **ID:** Entered by the user; if blank, auto-assign the next sequential number.
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**

- **Page Layout:**
  The Bidder Management section occupies the full width at the bottom of the page. The **Start Auction** button is fixed at the bottom and always visible.

---

### 1.4 Start Auction

- **Validation Criteria:**
  - **Auction Title:** Cannot be empty.
  - **Starting Price:** Must be provided and be positive.
  - **Minimum Bid Increment:** Must be provided and be positive.
  - **Auction Duration:** Must be provided and be positive.
  - **Bidder List:** Must include at least two bidders.

- **User Feedback:**
  If any validation fails, a toast message will inform the user of the specific error.

- **Action:**
  On successful validation, the auction details are saved to the database, the auction ID is obtained, and the app transitions to the **Bid Page** with the following data:
  - List of bidders
  - Starting price
  - Minimum bid increment
  - Auction title
  - Auction description

---

## 2. Bid Page

The Bid Page drives live bidding and real-time updates with a meticulously designed layout.

### 2.1 Overall Layout

- **Header (Single Row):**
  - **Left:**
    - **Title:** **"Phiên Đấu Giá"** (Auction Session)
    - **Status Pill:** **"Đang diễn ra"** (green background)
  - **Center:**
    - **Countdown Timer:** Large, bold green text (e.g., `04:35`)
  - **Right:**
    - **Button:** Red, labeled **"Kết Thúc Đấu Giá"** (End Auction)

- **Auction Information Panel:**
  Four equally sized columns display:
  1. **"Vòng đấu giá"** (Auction round) – e.g., `6`
  2. **"Giá hiện tại"** (Current price) – e.g., `1,500,000 VND`
  3. **"Bước giá"** (Bid increment) – e.g., `100,000 VND`
  4. **"Người tham gia"** (Participants) – e.g., `20`

- **Participant Selection Grid:**
  - **Title:** **"Chọn người tham gia"** (Select Participant)
  - **Grid:** 5 rows with up to 3 buttons per row (15 in total). Each button is a 32px x 32px square with a 1px border, 4px border radius, and displays a participant number.

- **Bidding Form:**
  - **Input Fields:**
    - **Name Field:** 100% width
    - **Price Field:** Approximately 40% width
  - **Action Buttons:**
    - **"Đấu Giá"** (Bid) – Blue button with white text
    - **"Hủy Đấu Giá Cuối"** (Cancel Last Bid) – White button with red text

- **Auction History Table:**
  Title: **"Lịch Sử Đấu Giá"** (Auction History)
  Columns include **"Vòng"** (Round), **"Người tham gia"** (Participant), **"Số tiền"** (Amount), **"Thời gian"** (Time) with alternating row colors.

- **Footer:**
  A right-aligned button: **"← Quay Lại Thiết Lập"** (Return to Setup)

---

### 2.2 Color Specifications

- **Main Background:** White (`#FFFFFF`)
- **Section Backgrounds:** Light gray (`#F5F5F5`)
- **Primary Button:** Blue (`#0D6EFD`)
- **Secondary Button:** White with red text (`#FFFFFF` / `#DC3545`)
- **Action Button:** Red (`#DC3545`)
- **Status Indicator & Timer:** Green (`#198754`)
- **Borders:** Light gray (`#DEE2E6`)
- **Text:** Dark gray/black (`#212529`)

---

### 2.3 Component Specifications

1. **Status Pill:**
   A rounded rectangle (4px radius) with a green background (`#198754`), white text, and 4px by 8px padding.

2. **Buttons:**
   Uniform styling with a 4px border radius, 6px by 12px padding, and 14px font size.

3. **Participant Selection Buttons:**
   Fixed at 32px by 32px with a 1px light gray border, 4px radius, and display participant numbers.

4. **Input Fields:**
   - Height: 38px
   - Border: 1px solid light gray (`#DEE2E6`)
   - Border Radius: 4px
   - Padding: 6px by 12px
   The name field occupies 100% width while the price field is about 40% wide.

5. **Table:**
   Full width with 8px cell padding, thin borders (`#DEE2E6`), a header with a slightly darker background, and alternating row colors.

---

### 2.4 Text Content

- **Header:**
  - **"Phiên Đấu Giá"**
  - **"Đang diễn ra"**
  - **"Kết Thúc Đấu Giá"**

- **Auction Information:**
  - **"Vòng đấu giá"**
  - **"Giá hiện tại"**
  - **"Bước giá"**
  - **"Người tham gia"**

- **Countdown Timer:**
  Labeled **"Thời gian còn lại"** (e.g., `04:35`).

- **Form Elements:**
  - **"Chọn người tham gia"**
  - **"Name"**
  - **"Price"**
  - **"Đấu Giá"**
  - **"Hủy Đấu Giá Cuối"**

- **Auction History Table:**
  - **"Lịch Sử Đấu Giá"**
  - **"Vòng"**
  - **"Người tham gia"**
  - **"Số tiền"**
  - **"Thời gian"**

- **Footer:**
  - **"← Quay Lại Thiết Lập"**

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

- **For Screens ≥768px:**
  The layout remains as specified.

- **For Smaller Screens:**
  - Auction information columns stack vertically if needed.
  - The participant grid adjusts for easier tapping.
  - The timer and **"Kết Thúc Đấu Giá"** button remain clearly visible.

---

### 2.7 Auction Bidding Logic

- **Initial State:**
  The auction starts at a predefined round (e.g., `6`), with the current price set at `1,500,000 VND`, a bid increment of `100,000 VND`, and a countdown timer of `04:35`.

- **Placing a Bid:**
  When a bidder is selected and the Name and Price are entered, clicking **"Đấu Giá"**:
  - Validates that if there is bid history, the new bid exceeds the current price.
  - For an initial bid (round 1), the price must be at least equal to the current price.
  - On a valid bid, increments the round number, updates the current price, logs the bid with a timestamp, and saves the bid (including bidder ID) to the database.
  - The **"Đấu Giá"** button is then disabled for that bidder until a subsequent bid is made.

- **Cancel Last Bid:**
  Clicking **"Hủy Đấu Giá Cuối"** reverts to the previous round, resets the current price, removes the last bid from the history, and disables the cancel option for that bidder until a new bid is placed.

- **Conditional Bid Options:**
  - **If bid history is empty and round is 1:**
    Display three options: **Tra Bang Gia Khoi Diem**, **Tra Theo Buoc Gia**, **Nhap Gia Tra**.
  - **Otherwise:**
    Display two options: **Tra Theo Buoc Gia**, **Nhap Gia Tra**.

- **Additional UI Behavior:**
  - When **Tra Theo Buoc Gia** is selected, use up/down icons to adjust the bid price by the bid increment.
  - Load and display the bidder list in the participant grid.
  - When a bidder is selected, start a 60-second countdown; once expired, disable the **"Đấu Giá"** button for that bidder.
  - After placing a bid, retain the selected bidder and format the display as `{BidderID} - {BidderName}`.
  - Sort the auction history by time in descending order (latest bid on top).

- **Data Persistence:**
  Auction data and bid history are loaded on page initialization, and the database is updated only when bids are placed or cancelled.

---

## 3. Auction Round Instructions

- **Initial Round:**
  The auction round starts at **1**.

- **Timer:**
  Each round features a timer (e.g., **300 seconds**).

- **Transition:**
  When the timer reaches **0**:
  - Bidding stops.
  - A **"Start Next Round"** button appears.
  - Clicking it increments the round number, resets the timer to **300 seconds**, and updates the database.

- **Conclusion:**
  After **round 6** ends (timer reaches **0**), the auction finishes—no further bids are accepted.

---

## 4. Auctioneer Management

- **Functionality:**
  A dedicated page allows adding, editing, or removing auctioneer information from the database.

- **Integration with Setup:**
  A button labeled **"Quan Ly Dau Gia Vien"** on the Setup Page navigates to the Auctioneer Management page. Auctioneer details are included in the auction setup and passed to the Bid Page when **"Bat Dau Dau Gia"** is clicked.

- **UI Adjustments:**
  Rename the **"Gia & Thoi Gian"** card to **"Cai Dat Dau Gia"**. Display **Gia Khoi Diem** and **Buoc Gia Toi Thieu** on the same line to conserve space. Provide a dropdown for auctioneer selection.

---

## 5. Popup Auction Info Page

This popup window displays key auction details and does not open automatically when the Bid Page loads.

### Layout Structure

1. **Header:**
   - Prominently displays the company name.
   - Shows the auction session ID and auctioneer’s name on the same line with the auction title.

2. **Auction Details Section:**
   - Displays **Starting Price (Giá khởi điểm)** and **Bid Step (Bước giá)** on the same line using a grid or card layout.

3. **Bid Information Section:**
   - Displays **Current Bidding Round (Lần trả giá)**.
   - **Highest Bidder (Người trả giá cao nhất)** appears on its own line (showing **"Chưa có"** if absent) alongside the highest bid amount (default **"0 đồng"** if no bid).

### Functional Requirements

- **Dynamic Data:**
  Auction data is fetched from an API or database and updated in real time.

- **Responsive Design:**
  Leverage Bootstrap’s grid system for optimal display on desktop, tablet, and mobile devices.

- **Styling & Error Handling:**
  Use Bootstrap typography and spacing classes, and display fallback text (**"Chưa có"**) if data is missing.

- **Export Feature:**
  When the auction ends, a button labeled **"Xuất dữ liệu"** exports details (auctioneer name, winner, winning price, start time, end time, total rounds, total bids, and bid history) to an Excel file.

### Suggested Components

1. **Header Component:**
   Contains the company name, session ID, and auctioneer name (center-aligned).
2. **Auction Details Component:**
   Displays starting price and bid step in a grid layout.
3. **Bid Information Component:**
   Displays current round, highest bidder, and highest bid in a card or table format.

### User Interaction & Accessibility

- The popup remains static initially; future enhancements may include interactive elements such as a countdown timer.
- Ensure semantic HTML with proper headings and high contrast for readability.

---

## 6. Continuous Bidding System (June 2023 Update)

The auction now operates on a continuous bidding system that eliminates round-based bidding until manually ended.

- **Key Changes:**
  1. Round-based logic is removed; the auction runs continuously until the **"Kết Thúc Đấu Giá"** button is clicked.
  2. Elapsed time is tracked and displayed.
  3. Bid history is now a simple chronological list.
  4. The UI emphasizes **"Lượt Trả Giá"** (number of bids) instead of auction rounds.

- **Backward Compatibility:**
  Internally, bids are still assigned a round value of 1.

- **Popup Synchronization:**
  When the Bid Page is opened (by admin), the auction popup displays:
  - Auction Company (default value)
  - **Dau Gia Vien:** Auctioneer’s name from the setup
  - **Gia Khoi Diem:** Starting Price
  - **Buoc Gia:** Bid Step
  - **Lan Tra Gia:** Bid Number
  - **Phien Dau Gia Tai San:** Auction round from setup (saved in the database)
  - **Nguoi Tra Gia Cao Nhat:** Highest bidder ID
  - **Thoi Gian Tra Con Lai:** Timer value synced with the Bid Page

- **Popup Close Mechanism:**
  The popup can only be closed via a button at the top right; it does not auto-close.

- **On "Ket Thuc Dau Gia" Click:**
  The popup displays:
  - Auction company name
  - Auction title
  - **Dau Gia Vien:** Auctioneer name
  - **Nguoi Tra Gia Cao Nhat:** Highest bidder ID
  - **Gia Tra Cao Nhat:** Winning price

- **Timer Synchronization:**
  The Bid Page passes the timer value to the popup. When a different bidder is selected, the timer resets accordingly.

---

## 7. BidControls Component Enhancements

### UI Elements

- **Timer Styling:**
  The timer is displayed with a larger font, distinct background color, and border. It is formatted as `mm:ss` (e.g., `04:35`).

- **"Bắt Đầu" Button:**
  A new "Bắt Đầu" (startBid) button is added above the timer in the top-right corner of the BidControls component.

- **Positioning:**
  Both the timer and the "Bắt Đầu" button must be prominently positioned without altering the original layout.

### Bid Logic Implementation

- **Initial State:**
  - The startBid button is enabled.
  - The timer is set to `bidDuration`.
  - The countdown is not active.

- **On "Bắt Đầu" Button Click:**
  - The countdown starts.
  - The current timer value is transmitted to the auction popup.
  - The startBid button is disabled (displayed in a gray color scheme).

- **During Countdown:**
  The startBid button remains disabled.

- **When Timer Reaches Zero:**
  - The startBid button is re-enabled.
  - The timer resets to `bidDuration`.
  - The timer value is not transmitted to the popup.

- **On "Đấu Giá" Button Click:**
  - The Bid Page sends a timer value of 0 to the auction popup to reset it.
  - The startBid button is re-enabled.
  - The timer resets to `bidDuration`.

- **Responsive Adjustments:**
  Address issues such as misaligned step increment/decrement buttons, overlapping bid buttons, and repositioning the startBid button and bidder timer.

#### Additional Behaviors

- **Bidder Selection:**
  - When a bidder is selected or deselected, reset the timer to `bidDuration` without starting the countdown, and ensure the "Bắt Đầu" button is enabled.

- **"Bắt Đầu" Button:**
  - Clicking it starts the countdown, transmits the timer value, and disables the button.
  - When the countdown ends, the button is re-enabled and the timer resets without transmitting.

- **"Đấu Giá" Button:**
  - Clicking it sends a timer value of 0 to the popup, resets the timer, and re-enables the startBid button.

---

# Component Modularization Strategy

A modular architecture is non-negotiable for maintainability and performance. The following directory structure and refactoring plan will significantly reduce complexity and improve testability.

## 1. Recommended Directory Structure


## 2. Key Refactoring Steps

### 2.1 Extract Timer Logic into a Custom Hook
- Isolate countdown functionality into a custom hook that:
  - Initializes the timer based on a provided duration.
  - Provides start and reset functions.
  - Updates the timer every second.
  - Returns a formatted time string, an active state indicator, and control functions.

### 2.2 Create a Dedicated Bid Management Hook
- Develop a hook to handle bid-related actions, including:
  - Placing a bid with rigorous error handling and user notifications.
  - Canceling a bid with consistent error management.

### 2.3 Split the UI into Focused Components
- Decompose the UI into smaller, dedicated components such as:
  - **TimerDisplay** for showing the countdown.
  - **BidderGrid** for listing bidders.
- Each component should manage its specific section of the UI.

## 3. State Management Improvements

### 3.1 Use Context API for Shared State
- Utilize the Context API to manage shared state such as the selected bidder and current auction price.
- Provide functions within the context to update state values.

### 3.2 Optimize Effect Dependencies
- Split complex side effects into focused `useEffect` hooks to trigger only necessary updates.

## 4. Readability Enhancements

### 4.1 Define TypeScript Interfaces
- Create interfaces to define the auction state structure, including auction ID, status, current price, bidder list, and bid history.
- Define interfaces for bid action handlers.

### 4.2 Create Utility Functions
- Develop functions to format bid history, currency, and timestamps.
- This promotes code reuse and clarity.

## 5. Proposed Component Structure

- **AuctionHeader:** Displays the auction title and current status.
- **Content Area:**
  - **BidderGrid:** Lists bidders and handles selection.
  - **BidControls:** Manages bid initiation and timer display.
  - **BidHistoryTable:** Displays the auction history.
- **AuctionPopup:** Displays detailed auction information.
- Wrap all components with a context provider for shared state.

## 6. Key Benefits

| Aspect              | Before         | After            |
|---------------------|----------------|------------------|
| **Component Size**  | 800+ LOC       | 150–300 LOC      |
| **State Management**| Component State| Context + Hooks  |
| **Reusability**     | Single Use     | Multi-component  |
| **Testability**     | Hard to Test   | Isolated Units   |
| **Maintenance**     | Fragile        | Predictable      |

## 7. Implementation Strategy

1. **Phase 1:** Extract individual UI components (e.g., TimerDisplay, BidderGrid).
2. **Phase 2:** Create context providers to manage shared state.
3. **Phase 3:** Refactor business logic into custom hooks.
4. **Phase 4:** Implement TypeScript interfaces for improved type safety.
5. **Phase 5:** Develop Storybook stories for visual testing.

This modular approach reduces component complexity by 60–70% while maintaining full functionality. Each part can be developed, tested, and maintained independently.

---

# Step-by-Step Refactoring Plan for BidPage

Improving the maintainability and readability of the BidPage component requires breaking it down into smaller, focused parts. Follow this step-by-step plan:

## 1. Extract Business Logic into Custom Hooks
- **Auction Data Management:**
  Refine or extract logic from the existing auction hook for data fetching, updating, and error handling.
- **Bid Actions:**
  Create a dedicated hook (e.g., `useBidActions`) to encapsulate functions for placing and canceling bids with robust error management.
- **Timer Management:**
  Enhance or extract timer functionality into a custom hook (e.g., `useBidderTimer` or `useAuctionTimer`).

## 2. Modularize the Component
- **Split UI into Smaller Components:**
  Break the BidPage into sub-components:
  - **AuctionHeader:** Displays the auction title, elapsed time, and an end auction button.
  - **AuctionSummary:** Shows current price, bid increment, and participant count.
  - **BidControls:** Manages bidder selection, bid input, and the countdown timer.
  - **BidHistoryTable:** Presents the bid history.
  - **AuctionPopup:** Manages the popup display for additional auction details.
- **Organize Files by Feature:**
  Place these components in dedicated directories (e.g., `@components/BidPage`) to improve reusability and separation of concerns.

## 3. Improve State Management
- **Centralize Shared State:**
  Use React’s Context API to manage shared auction data, reducing prop drilling and simplifying state updates.
- **Optimize Effects:**
  Split complex `useEffect` hooks into smaller ones for specific tasks.

## 4. Extract Utility Functions
- **Currency and Time Formatting:**
  Move formatting functions to separate modules (e.g., `bidFormatters.ts`) for code reuse.
- **Consistent Error Handling:**
  Centralize toast notifications and error messaging into helper functions.

## 5. Simplify Popup Management
- **Consolidate Popup Logic:**
  Extract logic for managing popups into a custom hook (e.g., `useAuctionPopup`).
- **Remove Redundant Flags:**
  Streamline state variables related to popup status.

## 6. Enhance Readability with TypeScript Interfaces
- **Define Clear Types:**
  Create interfaces for Auction, Bid, and BidHistory to ensure data consistency.
- **Type All Functions and Components:**
  Annotate functions and component props with TypeScript for clarity and reduced errors.

## 7. Organize Event Handlers and Helper Functions
- **Group Similar Handlers:**
  Organize functions for bidder selection, placing bids, and canceling bids.
- **Extract Helper Functions:**
  Move non-UI-specific helper functions outside the main component to reduce clutter.

## 8. Document and Comment Key Sections
- **Inline Documentation:**
  Comment non-trivial business logic, particularly around auction duration and popup synchronization.
- **Component Documentation:**
  Clearly document each sub-component and custom hook for future maintenance.

## 9. Final Integration and Testing
- **Combine Sub-Components:**
  Integrate the modular components into a simplified BidPage that orchestrates the overall layout.
- **Unit and Integration Testing:**
  Test each custom hook and component independently before validating the integrated page.
- **Code Review and Iteration:**
  Ensure the refactored structure improves readability and preserves functionality.

---

## Auction Popup Renderer Adjustments

Reorganize the AuctionPopupRenderer.tsx display with the following changes:

- **"Dau Gia Vien" (Auctioneer):**
  Place it on the same line as **"Phien Dau Gia Tai San"** by moving it from the detail rows to the auction title area.
- **"Gia Khoi Diem" (Starting Price) & "Buoc Gia" (Bid Step):**
  Reorganize these to appear on the same line in the detail rows.
- **"Nguoi Tra Gia Cao Nhat" (Highest Bidder):**
  Display on its own line.
- **"Lan Tra Gia" (Bid Round) & "Nguoi Tra Gia" (Current Bidder):**
  Organize these to appear on the same line.

**New Interaction Plan:**
- Add a button at the top center of the BidPage to manually open the auction popup.
- Ensure the auction popup does not open automatically when the BidPage loads.
- Set up the button to trigger the popup when clicked.

### Auction Popup Window During Bidding

1. The auction title area displays the auctioneer and auction title on the same line.
2. The highest bidder and highest bid price appear on the same line.
3. The starting price and bid step are shown on the same line.
4. The current bidder and bid time left are displayed on the same line.

---

This specification is uncompromising and detailed. Each section is designed to ensure the Auction App is modular, maintainable, and performs flawlessly. There is no room for mediocrity—every component, hook, and UI element must be implemented with precision and clarity.
