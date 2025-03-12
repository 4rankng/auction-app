# Auction App Product Specification

## 1. Overview

The Auction App is a high-performance auction platform engineered for operational excellence and a flawless user experience. This document defines a strict, production-grade architecture, ensuring that both auction administrators and bidders experience seamless interactions throughout the auction lifecycle.

---

## 2. Technology Stack

### Backend Server
- **Language:** Go
  *Leverage Go's performance and concurrency for a robust backend.*
- **Framework:** Gin
  *Gin's middleware and routing capabilities provide a solid foundation.*
- **Database:**
  **Recommendation:** Replace `tinydb` with a production-ready database such as PostgreSQL or MySQL.
  *A scalable, ACID-compliant database is non-negotiable in a high-stakes auction environment.*

### Web Server
- **Technologies:** HTML5, CSS3, JavaScript (ES6+)
  *Modern standards ensure cross-browser compatibility and performance.*
- **Libraries & Frameworks:**
  - **Bootstrap:** For responsive, mobile-first design.
  - **Axios:** For streamlined RESTful API calls.

---

## 3. Core Features

### 3.1 Backend API Endpoints

Each endpoint must be implemented with robust validation, proper error handling, and secure authentication where needed.

#### 3.1.1 Auction Management
- **Create Auction:**
  Initializes a new auction with parameters including:
  - Auction title
  - Initial price
  - Price increment (step)
  - List of bidders (with full details)
  - Scheduled auction start time
  *Strict validations and transactional integrity are required.*
- **Retrieve All Auctions:**
  Returns a paginated list of auctions.
- **Retrieve Single Auction:**
  Provides detailed information on a specific auction, including bid history.
- **Start Auction:**
  Transitions the auction state to active. Must ensure that the auction cannot be started more than once.
- **End Auction:**
  Concludes the auction and finalizes bidding.
- **Export Auction Data:**
  Generates a comprehensive export containing:
  - Auction Title
  - Auction Start Time and End Time
  - Starting Price and Price Increment
  - Total Bid Count and Complete Bid History
  - Winner Details (ID, Name, Address) and Final Winning Bid

#### 3.1.2 Bidding Operations
- **Place Bid:**
  Accepts and validates bids against the current highest bid.
  *Enforce strict rules to prevent race conditions and fraudulent bids.*
- **Retrieve Current Bids:**
  Returns real-time bid data for active auctions.
- **Retrieve Auction History:**
  Provides a detailed, chronological log of all bidding actions.

#### 3.1.3 Additional Functionalities
- **Excel File Parsing:**
  Parses an uploaded Excel file to extract a list of bidders without impacting the live database.
  *This must be stateless and idempotent.*

---

### 3.2 Frontend Pages

The web interface must be intuitive and responsive, delivering clear and consistent user experiences.

#### 3.2.1 Home Page (index.html)
- **Functionality:**
  - Displays all completed auctions.
  - Provides a form to create new auctions.
- **Key Considerations:**
  *Ensure the interface is optimized for both desktop and mobile experiences.*

#### 3.2.2 Auction Setup Page (setup.html)
- **Functionality:**
  - Configures auction details prior to commencement.
  - **Primary Action:**
    - A clearly labeled button “Bắt Đầu Đấu Giá” (Start Auction) which initiates the auction.
  - **Input Handling:**
    - Fields for "Giá Khởi Điểm" (Starting Price) and "Bước Giá" (Price Increment) that automatically format large numbers with commas.
    - Text fields for participant details ("Danh Sách Người Tham Gia") with inline edit and delete capabilities.
    - Optional field for "Mã Người Tham Gia" that auto-increments if left empty.
- **User Experience:**
  *The page should provide real-time validation and a smooth transition into the bidding phase.*

#### 3.2.3 Bidding Page (bid.html)
- **Functionality:**
  - Active bidding interface.
  - **Primary Action:**
    - A prominent “Kết Thúc Đấu Giá” (End Auction) button that terminates the bidding process and transitions to the results.
  - **Consistency:**
    - Similar input validation and data formatting as in the setup phase.
- **Real-Time Updates:**
  *Ensure live bid updates using WebSockets or similar technology for an engaging user experience.*

#### 3.2.4 Results Page (result.html)
- **Functionality:**
  - Prominently displays the auction winner and final bid details.
  - Shows a complete bid history.
  - Provides an option to return to the home page to start a new auction cycle.
- **Design:**
  *Must be designed to celebrate the auction outcome while ensuring data integrity and transparency.*

---

## 4. Navigation & State Management

The system must intelligently redirect users based on the auction's state stored in the database. The following logic applies:

- **Auction Not Started:**
  All requests should be redirected to **index.html**.
- **Auction In Progress:**
  Users must be redirected to **bid.html**.
- **Auction Ended:**
  All navigation should lead to **result.html**.

*Robust session management and state validation are essential to prevent unauthorized state transitions.*

---

## 5. Non-Functional Requirements

- **Performance:**
  The backend must handle high concurrency. Utilize caching strategies where applicable.
- **Security:**
  Implement strict authentication and authorization measures. All endpoints must be secured against common vulnerabilities (e.g., SQL injection, XSS).
- **Scalability:**
  The architecture should support horizontal scaling, especially for the bidding endpoints.
- **Maintainability:**
  Code must be modular and adhere to SOLID principles. Comprehensive logging and monitoring are mandatory.

