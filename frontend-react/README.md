# Auction App Product Specification

The Auction App is a single-page application (SPA) developed with **React.js** and styled exclusively with **Bootstrap**. Data persistence is managed via **local storage**. The app is divided into three core pages: **Setup**, **Bidding**, and **Result**.

---

## Pages Overview

1. **Setup Page**
2. **Bidding Page**
3. **Result Page**

*Note: Only the features detailed below must be implemented. No additional elements or functionalities are permitted.*

---

## 1. Setup Page

This page is responsible for auction configuration and bidder management. All specifications must be followed exactly without deviations.

### 1.1 Import Bidders

- **Functionality:**
  - Provide a button to import a list of bidders from an Excel file.

- **Design & Behavior:**
  - The button displays an Excel icon alongside the text "Import".
  - **Styling:**
    - **Border Color:** Excel green
    - **Background Color:** White
    - **Hover:** Include a noticeable animation effect
  - **Layout:**
    - Position the Import button to the right of the Add New Bidder button.
    - Ensure that buttons and input fields are aligned horizontally on the right side of the page and occupy the full page width.

### 1.2 Auction Configuration

- **Auction Details Card:**
  - Contains input fields for:
    - **Auction Title:** Mandatory
    - **Auction Description:** Optional

- **Pricing and Duration Card:**
  - Contains input fields for:
    - **Starting Price:** Mandatory; numeric value with thousand separators; default 0
    - **Minimum Bid Increment:** Mandatory; positive numeric value; default 0
    - **Auction Duration:** Mandatory; positive numeric value; default 0

### 1.3 Bidder Management

- **Display Existing Bidders:**
  - Retrieve and display bidders from the database in a table format with the following columns:
    - **ID** (unique identifier used during bidding)
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**

- **Add New Bidder Section:**
  - **Add Button:**
    - A square-shaped button featuring a plus sign icon (no text).
    - On click, save the new bidder’s details to the database and update the displayed list.
  - **Input Fields:**
    - **ID:** User-entered value; if left blank, auto-assign the next sequential number based on the highest existing ID.
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**

Auction Details on the left side of the page
Pricing and Duration on the right side of the page
Both of them occupy the full width of the page

Bidder Management is on the bottom of the page and take 100% width of the page

Start Auction button always at the bottom of the page, always visible even if we scroll, button take 100% width of the page




### Import Bidders From Excel File

#### Requirements
The application must be able to read an Excel file and locate a table within the sheet name "Đủ ĐK". The table starts with a specific cell containing the value **"STT"**. The columns within the table must follow this order:

1. **STT** (Serial Number)
2. **ID**
3. **Name**
4. **Address**
5. **NRIC** (National Registration Identity Card)
6. **Phone Number**

All values in these columns must be non-empty. If any value in a row is empty, that row is considered outside the table.

#### Process Flow
1. **Extract Data**
   - Identify the table header by finding the cell containing **"STT"**.
   - Validate that the next consecutive columns contain:
     - **"Họ tên"** (Name)
     - **"Địa chỉ"** (Address)
     - **"Giấy CMND/CCCD/ĐKDN"** (NRIC)
     - **"Số điện thoại"** (Phone Number)
   - Begin extracting data from the row immediately below the header.
   - Continue extracting until a row contains an empty value, indicating the end of the table.

2. **Save to Database**
   - The extracted bidder data (excluding the header row) must be saved to the database.
   - The displayed list in the application must be updated accordingly.

3. **Replacement of Existing Data**
   - When this function is executed, the new list of bidders extracted from the Excel file will **replace** the existing bidders in both the database and the displayed list.

#### Algorithm to Locate the Table
1. Search for the cell containing **"STT"**, e.g., `A10`.
2. Validate that the following cells contain the correct headers:
   - `B10`: **"Họ tên"**
   - `C10`: **"Địa chỉ"**
   - `D10`: **"Giấy CMND/CCCD/ĐKDN"**
   - `E10`: **"Số điện thoại"**
3. Begin extracting bidder details from row `A11, B11, C11, D11, E11`, ensuring all values are non-empty.
4. Move to the next row (`A12, B12, C12, D12, E12`) and repeat until a row contains an empty value.
5. The table ends at the first row with missing values.

#### Example Table

| STT | Họ tên            | Địa chỉ                                      | Giấy CMND/CCCD/ĐKDN | Số điện thoại |
|----|------------------|------------------------------------------|--------------------|--------------|
| 1  | Nguyễn Ngọc Mai  | 476 Trần Hưng Đạo, Ngọc Châu, TP. Hải Dương, Hải Dương | 030183002000       | 0966592838   |
| 2  | Đinh Thị Hường   | 23B/182 Phương Lưu, Vạn Mỹ, Ngô Quyền, Hải Phòng | 031166017315       | 0912052234   |
| 3  | Hoàng Thị Chi    | TDP Đông Hải Sơn, Đồ Sơn, Hải Phòng      | 031163007523       | 0906032859   |

### 1.4 Start Auction

- **Validation Criteria:**
  The app must validate the following before starting the auction:
  - **Auction Title:** Must be provided
  - **Starting Price:** Must be provided and be a positive number
  - **Minimum Bid Increment:** Must be provided and be a positive number
  - **Auction Duration:** Must be provided and be a positive number
  - **Bidder List:** Must include at least two bidders

- **User Feedback:**
  - If any validation fails, display a toast message indicating the specific error.

- **Action:**
  - Upon successful validation, save the auction details to the database, get the auction id and transition to the **Bidding Page** while transferring:
    - List of bidders
    - Starting price
    - Minimum bid increment
    - Auction title
    - Auction description

---

**IMPORTANT NOTICE:**
Implement only the features specified in this document. Do not introduce any additional fields, functionalities, or extraneous information.

---

# Vietnamese Auction Interface Design Specifications (Improved)


## 1. Overall Layout

1. **Header (Single Row)**
   - **Left**:
     - Title: “Phiên Đấu Giá” (Auction Session)
     - Status pill: “Đang diễn ra” (In progress) with green background
   - **Center**:
     - Countdown Timer (e.g., `04:35`) in large, bold green text
   - **Right**:
     - Red button labeled “Kết Thúc Đấu Giá” (End Auction)

2. **Auction Information Panel (Below Header)**
   - Four equally sized columns displaying:
     1. **“Vòng đấu giá”** (Auction round): e.g., `6`
     2. **“Giá hiện tại”** (Current price): e.g., `1,500,000 VND`
     3. **“Bước giá”** (Bid increment): e.g., `100,000 VND`
     4. **“Người tham gia”** (Participants): e.g., `20`

3. **Participant Selection Grid**
   - Title: “Chọn người tham gia” (Select participant)
   - 5 rows, each containing up to 3 participant buttons (total 15)
   - Each button:
     - Square (approx. 32px x 32px)
     - Thin 1px border
     - 4px border radius
     - Displays a participant number

4. **Bidding Form**
   - **Name Field** (100% width)
   - **Price Field** (approx. 40% width)
   - **Action Buttons**:
     1. Blue button with white text: “Đấu Giá” (Bid)
     2. White button with red text: “Hủy Đấu Giá Cuối” (Cancel Last Bid)

5. **Auction History Table**
   - Section title: “Lịch Sử Đấu Giá” (Auction History)
   - Columns: “Vòng” (Round), “Người tham gia” (Participant), “Số tiền” (Amount), “Thời gian” (Time)
   - Alternating row backgrounds (light gray, white)

6. **Footer**
   - Button aligned right: “← Quay Lại Thiết Lập” (Return to Setup)

---

## 2. Color Specifications

- **Main Background**: White (`#FFFFFF`)
- **Section Backgrounds**: Light gray (`#F5F5F5`)
- **Primary Button**: Blue (`#0D6EFD`)
- **Secondary Button**: White with red text (`#FFFFFF` / `#DC3545`)
- **Action Button**: Red (`#DC3545`)
- **Status Indicator**: Green (`#198754`)
- **Countdown Timer Text**: Green (`#198754`)
- **Borders**: Light gray (`#DEE2E6`)
- **Text**: Dark gray/black (`#212529`)

Use these colors consistently to reinforce brand identity and ensure visual clarity.

---

## 3. Component Specifications

1. **Status Pill**
   - Rounded rectangle (4px border radius)
   - Green background (`#198754`)
   - White text
   - Padding: 4px 8px

2. **Buttons**
   - Border radius: 4px
   - Padding: 6px 12px
   - Font size: 14px
   - Consistent vertical spacing to maintain a neat visual hierarchy

3. **Participant Selection Buttons**
   - 32px x 32px
   - 1px border (`#DEE2E6`)
   - 4px border radius
   - Numeric labels (1, 2, 3, etc.)

4. **Input Fields**
   - Height: 38px
   - Border: 1px solid light gray (`#DEE2E6`)
   - Border radius: 4px
   - Padding: 6px 12px
   - Name field: 100% width
   - Price field: ~40% width

5. **Table**
   - 100% width
   - Thin borders (`#DEE2E6`)
   - 8px padding in cells
   - Header row with slightly darker background
   - Alternating row background colors (white, light gray)

---

## 4. Text Content

1. **Header**
   - “Phiên Đấu Giá” (Auction Session)
   - “Đang diễn ra” (In progress)
   - “Kết Thúc Đấu Giá” (End Auction)

2. **Auction Information**
   - “Vòng đấu giá” (Auction round)
   - “Giá hiện tại” (Current price)
   - “Bước giá” (Bid increment)
   - “Người tham gia” (Participants)

3. **Countdown Timer**
   - “Thời gian còn lại” (Time remaining)
   - Display the time (e.g., `04:35`)

4. **Form Elements**
   - “Chọn người tham gia” (Select participant)
   - “Name” (Name)
   - “Price” (Price)
   - “Đấu Giá” (Bid)
   - “Hủy Đấu Giá Cuối” (Cancel Last Bid)

5. **History Table**
   - “Lịch Sử Đấu Giá” (Auction History)
   - “Vòng” (Round)
   - “Người tham gia” (Participant)
   - “Số tiền” (Amount)
   - “Thời gian” (Time)

6. **Footer**
   - “← Quay Lại Thiết Lập” (Return to Setup)

---

## 5. Sample Data to Include

- **Current Auction State**
  - Round: `6`
  - Current price: `1,500,000 VND`
  - Bid increment: `100,000 VND`
  - Participants: `20`
  - Remaining time: `04:35`

- **Auction History**
  1. Round 5: Nguyễn Văn A, 1,500,000 VND, 13/03/2023 10:25:30
  2. Round 4: Trần Thị B, 1,400,000 VND, 13/03/2023 10:24:15
  3. Round 3: Lê Văn C , 1,300,000 VND, 13/03/2023 10:23:05
  4. Round 2: Phạm Thị D, 1,200,000 VND, 13/03/2023 10:22:10
  5. Round 1: Hoàng Văn E, 1,100,000 VND, 13/03/2023 10:21:00

---

## 6. Responsive Behavior

- Maintain layout integrity for screens ≥768px wide.
- On smaller screens:
  - Stack the four auction info columns vertically if needed.
  - Adjust participant grid to remain easily tappable.
  - Ensure the timer and “Kết Thúc Đấu Giá” button remain visible and distinct.

---

## 7. Auction Bidding Logic

A robust bidding logic enforces fairness and transparency:

1. **Initial State**
   - Auction starts at a predefined round (e.g., Round 6).
   - Current price: `1,500,000 VND`.
   - Bid increment: `100,000 VND`.
   - Countdown timer: `04:35`.

2. **Placing a Bid**
   - User selects a participant and inputs Name + Price.
   - Clicking “Đấu Giá” checks:
     - **Validation**: Price ≥ Current Price + Bid Increment.
       - If valid:
         - Round number increments by 1.
         - Current price updates to the new bid.
         - Auction history logs the bid with a timestamp.
         - Timer may reset or continue based on rules.
       - If invalid:
         - Show an error (e.g., “Bid too low”).
         - No data changes.

3. **Cancel Last Bid**
   - Clicking “Hủy Đấu Giá Cuối” reverts to the previous round:
     - Round number decrements by 1.
     - Current price reverts to its previous value.
     - Last entry removed from Auction History.
   - Strictly limit who can perform this action (e.g., admin only).

4. **End Auction**
   - Clicking “Kết Thúc Đấu Giá” immediately stops the auction:
     - Timer halts.
     - No more bids accepted.
     - Highest bid at that moment is final.

5. **Enforcement**
   - Disallow bids below the required increment threshold.
   - No negative or zero bids.
   - Each participant can only place bids for themselves unless configured otherwise.

Adhering to these rules ensures a fair, transparent auction that participants can trust.



