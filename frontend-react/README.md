# Auction App Product Specification

The Auction App is a single-page application (SPA) built with **React.js** and styled exclusively with **Bootstrap**. Data persistence is handled via **local storage**. The application consists of three core pages: **Setup Page**, **Bid Page**, and **Auctioneer Management Page**.

> **Note:** Only the features detailed below must be implemented. No additional functionalities are permitted.

---

## Table of Contents

1. [Setup Page](#setup-page)
   1. [Import Bidders](#import-bidders)
   2. [Auction Configuration](#auction-configuration)
   3. [Bidder Management](#bidder-management)
   4. [Start Auction](#start-auction)
2. [Bid Page](#bid-page)
   1. [Overall Layout](#overall-layout)
   2. [Color Specifications](#color-specifications)
   3. [Component Specifications](#component-specifications)
   4. [Text Content](#text-content)
   5. [Sample Data](#sample-data)
   6. [Responsive Behavior](#responsive-behavior)
   7. [Auction Bidding Logic](#auction-bidding-logic)
3. [Auction Round Instructions](#auction-round-instructions)
4. [Auctioneer Management](#auctioneer-management)
5. [Popup Auction Info Page](#popup-auction-info-page)

---

## 1. Setup Page

The Setup Page is responsible for auction configuration and bidder management. All specifications must be strictly followed.

### 1.1 Import Bidders

**Functionality:**
- Provide a button to import a list of bidders from an Excel file.

**Design & Behavior:**
- The button displays an Excel icon with the text **"Import"**.
- **Styling:**
  - **Border Color:** Excel green
  - **Background Color:** White
  - **Hover Effect:** Noticeable animation
- **Layout:**
  - Position the Import button to the right of the Add New Bidder button.
  - Align all buttons and input fields horizontally on the right side, occupying the full page width.

**Excel Import Requirements:**
- **Table Location:** Read the Excel file and locate the table in the sheet named **"Đủ ĐK"**.
- **Table Structure (in order):**
  1. **STT** (Serial Number)
  2. **ID**
  3. **Name**
  4. **Address**
  5. **NRIC** (National Registration Identity Card)
  6. **Phone Number**
- **Data Extraction Process:**
  1. Locate the header cell containing **"STT"** (e.g., `A10`).
  2. Validate that the next consecutive cells contain:
     - `B10`: **"Họ tên"**
     - `C10`: **"Địa chỉ"**
     - `D10`: **"Giấy CMND/CCCD/ĐKDN"**
     - `E10`: **"Số điện thoại"**
  3. Extract data from the row immediately below the header until encountering an empty cell.
  4. Replace any existing bidder data in the database and the displayed list with the new data.

**Example Table:**

| STT | Họ tên            | Địa chỉ                                      | Giấy CMND/CCCD/ĐKDN | Số điện thoại |
|-----|-------------------|----------------------------------------------|---------------------|---------------|
| 1   | Nguyễn Ngọc Mai   | 476 Trần Hưng Đạo, Ngọc Châu, TP. Hải Dương   | 030183002000        | 0966592838    |
| 2   | Đinh Thị Hường    | 23B/182 Phương Lưu, Vạn Mỹ, Ngô Quyền, Hải Phòng | 031166017315      | 0912052234    |
| 3   | Hoàng Thị Chi     | TDP Đông Hải Sơn, Đồ Sơn, Hải Phòng            | 031163007523        | 0906032859    |

---

### 1.2 Auction Configuration

**Auction Details Card:**
- **Auction Title:** Mandatory
- **Auction Description:** Optional

**Pricing and Duration Card:**
- **Starting Price:** Mandatory; numeric with thousand separators; default is 0.
- **Minimum Bid Increment:** Mandatory; positive number; default is 0.
- **Auction Duration:** Mandatory; positive number; default is 0.

**Layout:**
- Auction Details appear on the left side.
- Pricing and Duration appear on the right side.
- Both cards span the full width of the page.

---

### 1.3 Bidder Management

**Display Existing Bidders:**
- Retrieve bidder data from the database and display it in a table with columns:
  - **ID** (unique identifier)
  - **Name**
  - **NRIC**
  - **Issuing Authority**
  - **Address**

**Add New Bidder Section:**
- **Add Button:**
  - A square button featuring a plus sign icon (no text).
  - On click, save the new bidder’s details to the database and update the displayed list.
- **Input Fields:**
  - **ID:** User-entered; if left blank, auto-assign the next sequential number.
  - **Name**
  - **NRIC**
  - **Issuing Authority**
  - **Address**

**Page Layout:**
- The Bidder Management section occupies the bottom of the page (100% width).
- The **Start Auction** button is fixed at the bottom, always visible (100% width).

---

### 1.4 Start Auction

**Validation Criteria:**
- **Auction Title:** Must be provided.
- **Starting Price:** Must be provided and be a positive number.
- **Minimum Bid Increment:** Must be provided and be a positive number.
- **Auction Duration:** Must be provided and be a positive number.
- **Bidder List:** Must include at least two bidders.

**User Feedback:**
- If any validation fails, display a toast message indicating the specific error.

**Action:**
- Upon successful validation, save the auction details to the database, obtain the auction ID, and transition to the **Bid Page** with:
  - List of bidders
  - Starting price
  - Minimum bid increment
  - Auction title
  - Auction description

---

## 2. Bid Page

The Bid Page manages live bidding and real-time auction updates.

### 2.1 Overall Layout

1. **Header (Single Row):**
   - **Left:**
     - Title: **“Phiên Đấu Giá”** (Auction Session)
     - Status pill: **“Đang diễn ra”** (green background)
   - **Center:**
     - Countdown Timer (e.g., `04:35`) in large, bold green text.
   - **Right:**
     - Red button labeled **“Kết Thúc Đấu Giá”** (End Auction)

2. **Auction Information Panel:**
   - Four equally sized columns displaying:
     1. **“Vòng đấu giá”** (Auction round): e.g., `6`
     2. **“Giá hiện tại”** (Current price): e.g., `1,500,000 VND`
     3. **“Bước giá”** (Bid increment): e.g., `100,000 VND`
     4. **“Người tham gia”** (Participants): e.g., `20`

3. **Participant Selection Grid:**
   - Title: **“Chọn người tham gia”** (Select participant)
   - Grid: 5 rows, each with up to 3 buttons (15 total).
   - Each button is:
     - Square (approx. 32px x 32px)
     - Bordered (1px) with a 4px radius
     - Labeled with a participant number

4. **Bidding Form:**
   - **Name Field:** 100% width.
   - **Price Field:** Approximately 40% width.
   - **Action Buttons:**
     - Blue button with white text: **“Đấu Giá”** (Bid)
     - White button with red text: **“Hủy Đấu Giá Cuối”** (Cancel Last Bid)

5. **Auction History Table:**
   - Section title: **“Lịch Sử Đấu Giá”** (Auction History)
   - Columns: **“Vòng”** (Round), **“Người tham gia”** (Participant), **“Số tiền”** (Amount), **“Thời gian”** (Time)
   - Alternating row backgrounds (light gray, white).

6. **Footer:**
   - Right-aligned button: **“← Quay Lại Thiết Lập”** (Return to Setup)

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

1. **Header:**
   - **“Phiên Đấu Giá”**, **“Đang diễn ra”**, **“Kết Thúc Đấu Giá”**.

2. **Auction Information:**
   - **“Vòng đấu giá”**, **“Giá hiện tại”**, **“Bước giá”**, **“Người tham gia”**.

3. **Countdown Timer:**
   - Label: **“Thời gian còn lại”** (e.g., `04:35`).

4. **Form Elements:**
   - **“Chọn người tham gia”**, **“Name”**, **“Price”**, **“Đấu Giá”**, **“Hủy Đấu Giá Cuối”**.

5. **Auction History Table:**
   - **“Lịch Sử Đấu Giá”**, **“Vòng”**, **“Người tham gia”**, **“Số tiền”**, **“Thời gian”**.

6. **Footer:**
   - **“← Quay Lại Thiết Lập”**.

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

- For screens **≥768px**: Maintain the layout as described.
- For smaller screens:
  - Stack auction information columns vertically if needed.
  - Adjust the participant grid for ease of tapping.
  - Ensure the timer and **“Kết Thúc Đấu Giá”** button remain visible.

---

### 2.7 Auction Bidding Logic

**Initial State:**
- Auction starts at a predefined round (e.g., `6`).
- Current Price: `1,500,000 VND`
- Bid Increment: `100,000 VND`
- Countdown Timer: `04:35`

**Placing a Bid:**
- User selects a participant and enters Name and Price.
- Clicking **“Đấu Giá”** validates:
  - **If bid history is not empty:** Price must be greater than the current price.
  - **If bid history is empty and round is 1:** Price must be at least equal to the current price.
- On a valid bid:
  - Increment the round number.
  - Update the current price.
  - Log the bid with a timestamp in the auction history.
  - Persist the bid (including bidder ID) to the database.
- Disable the **“Đấu Giá”** button for the current bidder until another bid is placed.

**Cancel Last Bid:**
- Clicking **“Hủy Đấu Giá Cuối”**:
  - Reverts to the previous round.
  - Resets the current price to its previous value.
  - Removes the last bid from the auction history.
  - Disables the cancel button for that bidder until a new bid is placed.

**Conditional Bid Options:**
- **If bid history is empty and round is 1:**
  - Display three options: **Tra Bang Gia Khoi Diem**, **Tra Theo Buoc Gia**, **Nhap Gia Tra**.
- **Otherwise:**
  - Display two options: **Tra Theo Buoc Gia**, **Nhap Gia Tra**.

**Additional UI Behavior:**
- When **Tra Theo Buoc Gia** is selected, use up/down triangle icons to adjust the price by the bid increment.
- Load the bidder list from the database and display it in the participant grid.
- On selecting a bidder, start a 60-second countdown; once expired, disable the **“Đấu Giá”** button for that bidder.
- After placing a bid, retain the selected bidder and the value in the **Ma So / Ten** textbox, formatted as `{BidderID} - {BidderName}`.
- Sort the auction history table by time in descending order (latest bid on top).

**Data Persistence:**
- Do not use constant database polling.
- Load auction data and bid history when the page initializes.
- Update the database only when bids are placed or cancelled.

---

## 3. Auction Round Instructions

- **Initial Round:**
  The auction round (**Vong Dau Gia**) starts at **1**.
- **Timer:**
  Each round has a timer (e.g., **300 seconds**).
- **Transition:**
  - When the timer reaches **0**, bidding stops and a **"Start Next Round"** button appears.
  - Clicking this button:
    - Increments the round number.
    - Resets the timer to **300 seconds**.
    - Updates the new round number and timer in the database.
- **Conclusion:**
  After **round 6** ends (timer reaches **0**), the auction finishes and no further bids are accepted.

---

## 4. Auctioneer Management

**Functionality:**
- Provide a dedicated page to add, edit, or remove auctioneer information in the database.

**Integration with Setup Page:**
- Include a button labeled **“Quan Ly Dau Gia Vien”** on the Setup Page.
- Clicking this button navigates to the Auctioneer Management page.
- Auctioneer information is part of the auction setup.
- When the **“Bat Dau Dau Gia”** button is clicked, include the auctioneer's details in the auction data sent to the database and passed to the Bid Page.

**UI Adjustments in Setup Page:**
- Rename the **“Gia & Thoi Gian”** card to **“Cai Dat Dau Gia”**.
- Display **Gia Khoi Diem** and **Buoc Gia Toi Thieu** on the same line to save space.
- Provide a dropdown option to select the auctioneer.

---

## 5. Popup Auction Info Page

This browser popup displays key auction details.

### Layout Structure

1. **Header:**
   - Display the company name prominently.
   - Show the auction session ID (**“Phiên đấu giá tài sản”**) and the auctioneer's name (**“Đấu giá viên”**).

2. **Auction Details Section:**
   - Display key information:
     - **Starting Price (Giá khởi điểm)**
     - **Bidding Step (Bước giá)**
   - Organize using a simple grid or card layout.

3. **Bid Information Section:**
   - Display:
     - **Current Bidding Round (Lần trả giá)**
     - **Highest Bidder (Người trả giá cao nhất)** – show **“Chưa có”** if no bids.
     - **Highest Bid Amount (Giá trả cao nhất)** – default to **“0 đồng”** if no bids.
   - Use a table or list format for clarity.

### Functional Requirements

- **Dynamic Data Display:**
  Fetch auction data from an API or database and update bid details in real time.
- **Responsive Design:**
  Use the Bootstrap grid system to ensure proper display on desktop, tablet, and mobile.
- **Styling & Error Handling:**
  - Utilize Bootstrap typography and spacing classes (e.g., `h1`, `h2`, `text-center`, `mt-3`, `mb-4`).
  - Display fallback text (**“Chưa có”**) if data is missing.
- **Export Feature:**
  When the auction ends, include a button labeled **“Xuất dữ liệu”** to export to Excel file:
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

- The page is static (no interactive buttons initially).
- Future enhancements may include a countdown timer or interactive bid controls.
- Ensure semantic HTML (proper headings and labels) and high contrast for readability.

---

**IMPORTANT NOTICE:**
Implement only the features specified in this document. Any deviation or additional functionality is not permitted.
