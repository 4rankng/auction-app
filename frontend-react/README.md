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
  - Upon successful validation, transition to the **Bidding Page** while transferring:
    - List of bidders
    - Starting price
    - Minimum bid increment
    - Auction title
    - Auction description

---

**IMPORTANT NOTICE:**
Implement only the features specified in this document. Do not introduce any additional fields, functionalities, or extraneous information.
