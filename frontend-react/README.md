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


# UI Design Guidelines for Bootstrap-React Applications

Our user interface must be simple, elegant, and uncompromisingly effective. We insist on clarity, efficiency, and a design that commands attention without distractions.

## Design Principles

### Embrace Minimalism
- **Essential Information Only:** Display only the critical details on each auction card.
- **Clean, Bootstrap-Driven Layouts:** Leverage Bootstrap's grid system and utility classes to create uncluttered layouts with ample white space.
- **Eliminate Redundancy:** Remove any non-essential features and decorative elements that do not directly enhance user experience.

### Establish Visual Hierarchy
- **Clear Element Differentiation:** Utilize size and spacing to distinguish primary elements from secondary ones.
- **Effective Calls-to-Action:** Use Bootstrap’s color schemes and contrasting classes to highlight key actions (e.g., the "Create New Auction" button).
- **Consistent Heading Structure:** Enforce uniform heading sizes using Bootstrap typography classes to create a logical information hierarchy.

### Maintain Consistency
- **Uniform Components:** Enforce consistent styling by leveraging Bootstrap's pre-defined button styles, form controls, and components across the application.
- **Standard Spacing:** Rely on Bootstrap spacing utilities (e.g., `m-3`, `p-2`) to maintain predictable spacing between elements.
- **Predictable Behavior:** Ensure all interactive elements behave consistently by adhering strictly to Bootstrap’s component guidelines.

## Visual Implementation

### Strategic Use of White Space
- **Generous Margins:** Use Bootstrap’s margin utilities to ensure content is well-separated.
- **Consistent Spacing Increments:** Apply consistent spacing (e.g., 8px, 16px, 32px) to reinforce a clean layout.
- **Functional Separation:** Use clear divisions between functional areas to enhance usability.

### Color System
- **Restrained Palette:** Limit the design to 3–4 primary colors plus neutrals, in line with Bootstrap’s color system.
- **Purposeful Color Usage:** Employ colors strategically to indicate statuses (e.g., the "ENDED" badge) and guide user attention.
- **High Contrast:** Enforce a minimum contrast ratio of 4.5:1 between text and backgrounds for accessibility.

### Typography
- **Single Primary Font:** Choose one primary font family with various weights, leveraging Bootstrap’s typography utilities for consistency.
- **Consistent Type Scale:** Maintain a reliable type scale (e.g., 1.2 or 1.25 ratio) across all headings and body text.
- **Enhanced Readability:** Keep line lengths to 50–75 characters and a line height of 1.5 for optimal readability.

## Technical Approach

### Responsive Design
- **Mobile-First Strategy:** Implement fluid layouts using Bootstrap’s responsive grid system that adapts to all screen sizes.
- **Rigorous Testing:** Test designs on multiple devices and resolutions to ensure uniform experience.
- **Relative Units:** Utilize rem, %, and viewport-based units instead of fixed pixels wherever possible.

### Component Architecture
- **Reusable React Components:** Build scalable, reusable components that integrate seamlessly with Bootstrap.
- **Clear Documentation:** Document component usage and variants clearly to maintain a consistent design language.
- **Grid and Utility Classes:** Leverage Bootstrap’s grid system and utility classes for consistent spacing and alignment.
- **Uniform Validation:** Use Bootstrap’s form validation styles to standardize feedback across forms.

### Performance Considerations
- **Optimized Loading:** Lazy load images and non-critical content to improve performance.
- **Minimal Animations:** Eliminate unnecessary animations that may impact performance.
- **Efficient State Management:** Adopt robust state management practices in React to ensure swift UI responsiveness.
- **Priority Content Loading:** Ensure that above-the-fold content loads immediately without delay.

## Implementation Checklist
- **Type Definitions:** Update type definitions to support UI requirements within our React components.
- **Design System:** Develop a comprehensive design system document incorporating Bootstrap’s color, typography, and component standards.
- **Form Handling:** Implement consistent form validation and handling using Bootstrap’s built-in styles.
- **Data Formatting:** Standardize the display formats for currency, dates, and status indicators.
- **Responsive Breakpoints:** Define and rigorously test responsive breakpoints for various devices.
- **State Handling:** Ensure proper management and display of loading, empty, and error states.




# Auction Workflow Implementation Guide

This guide details the auction workflow, divided into distinct phases and steps. The system is built in two major parts: the Auction Setup phase and the Live Auction phase. Each step includes clear directives on functionality, validations, and UI updates.

---

## 1. Auction Setup Phase

### 1.1. Auction Configuration
- **Starting Price & Bid Increment**
  - Provide input fields for the starting price ("Giá Khởi Điểm") and bid increment ("Bước Giá").
  - Apply currency formatting (using dots as thousand separators).
  - Validate that both values are positive numbers.

- **Auction Asset & Auctioneer**
  - Input field for auction asset details.
  - Dropdown selection for the auctioneer (Đấu Giá Viên), e.g., “Phạm Tuấn”, “Nguyễn Văn Khoán”.

### 1.2. Participant Management
- **Manual Entry**
  - Create fields to input participant information:
    - Participant ID (Mã Số)
    - Name (Tên)
    - Identification (CCCD/DKKD)
    - Issuing Authority (Nơi Cấp)
    - Address (Địa Chỉ)
  - Ensure at least the Participant ID and Name are provided before adding.

- **Import from Excel**
  - Allow users to import a list of participants from an Excel file.
  - Validate that duplicate Participant IDs are not added.

- **Display Participant List**
  - Use a table or Treeview to display all added participants.

### 1.3. Start Auction Transition
- **Validation**
  - Ensure all auction configuration fields are properly filled.
  - Confirm that at least one participant is added.
- **Transition**
  - On clicking “Bắt Đầu Đấu Giá”, validate inputs and then close the setup form.
  - Launch the Live Auction phase with the entered configuration and participant list.

---

## 2. Live Auction Phase

### 2.1. Auction Information Display
- **Header Information**
  - Display the auction asset, auctioneer, starting price, and bid increment prominently.

- **Live Bid Details**
  - Show the current bid round (Lần Trả Giá).
  - Display the current highest bid and the corresponding bidder.
  - Present a separate information screen (or panel) that continuously reflects live updates.

- **Countdown Timer**
  - Display a countdown timer initialized to 60 seconds.
  - Allow controls to start, pause, and reset the timer.
  - Update the timer display every second using a recurring update mechanism (e.g., Tkinter’s `after` method).

### 2.2. Bid Submission Process
- **Participant Selection**
  - Display participant buttons (using unique IDs) so that bidders can be selected.
  - Once selected, disable the participant’s button to avoid immediate consecutive bids.

- **Bidding Options**
  - **For the First Bid:**
    - Option to bid using the starting price (“Trả bằng giá khởi điểm”).
    - Option to manually input a bid (“Nhập giá trả”).
    - Option to bid incrementally (“Trả theo bước giá”) where the bid is calculated as:
      - Starting Price + (Number of Increments × Bid Increment)
  - **For Subsequent Bids:**
    - Only allow bidding using the bid increment (current highest bid + (number of increments × bid increment)).

- **Input Validation**
  - Ensure that each new bid is a valid number.
  - Verify that the new bid is higher than the current highest bid.
  - Prevent the same participant from bidding twice in a row.

### 2.3. Updating Auction State
- **Bid History**
  - Record every bid with details:
    - Bid round number
    - Participant ID and Name
    - Bid amount (formatted as currency)
  - Display bid history in a scrollable table (Treeview).

- **UI Updates**
  - Update the live auction information screen after each bid.
  - Increment the bid round counter.
  - Reset the countdown timer to 60 seconds after each successful bid.
  - Update the display to show the new highest bid and highest bidder.

### 2.4. Additional Controls
- **Remove Last Bid**
  - Provide a button to remove the most recent bid.
  - Update the bid round, highest bid, and highest bidder accordingly.

- **End Auction**
  - Include an “End Auction” (Kết Thúc) button.
  - Confirm with the user before ending the auction.
  - On confirmation, display the final auction results (highest bidder and final bid amount).

- **Export Bid History**
  - Once the auction is concluded, enable an “Export File” (Xuất File) button.
  - Allow users to export the bid history to an Excel file.

---

## 3. Time Management
- **Countdown Implementation**
  - Initialize a countdown starting at 60 seconds.
  - Provide functionality to start, pause, and reset the timer.
  - Reflect the countdown on both the bid submission area and the live auction information panel.
  - Use a timed loop (e.g., via `after` method) to decrement the timer every second.

---

## 4. UI, Styling, and Validation
- **Custom Styling**
  - Use a consistent styling approach (e.g., Tkinter’s ttk styles) for fonts, buttons, labels, and tables.
  - Maintain a clean, professional look with a uniform layout across all forms.

- **Currency Formatting**
  - Implement a dedicated function to format bid amounts and prices with the appropriate thousand separators and currency suffix.

- **Error Handling & User Feedback**
  - Validate numerical inputs to ensure they are positive and correctly formatted.
  - Display error or warning messages for invalid actions such as:
    - Bidding an amount lower than the current highest bid.
    - Consecutive bids from the same participant.
  - Use confirmation dialogs before critical actions (e.g., ending the auction or removing a bid).

---

## 5. Summary Workflow
1. **Setup Phase (Form1)**
   - Configure auction parameters (starting price, bid increment, asset, auctioneer).
   - Manage participant data manually or via Excel import.
   - Validate inputs and transition to the live auction phase upon starting.

2. **Live Auction Phase (Form2)**
   - Display live auction details including asset, auctioneer, current bid round, highest bid, and countdown timer.
   - Allow participant selection and provide multiple bidding options for the first bid; restrict to incremental bidding for subsequent bids.
   - Update bid history, bid round counter, and reset the timer after each bid.
   - Offer controls to remove the latest bid, end the auction, and export bid history.

3. **Finalization**
   - Display final results once the auction is ended.
   - Provide the option to export the complete bid history for record-keeping.
