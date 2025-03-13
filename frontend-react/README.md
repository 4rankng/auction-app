# Auction App Product Specification

The Auction App is a single-page application (SPA) built with **React.js** and styled using **Bootstrap**. It leverages **local storage** for data persistence and consists of three essential pages: **Setup**, **Bidding**, and **Result**. All components must use Bootstrap for styling.

---

## Pages Overview

### 1. Setup Page

This page is dedicated to configuring the auction and managing bidder information. The implementation must adhere strictly to the requirements—no additional features, fields, or extraneous information.

#### Features:

- **Import Bidders:**
  - A button to import a list of bidders from an Excel file.

- **Auction Configuration:**
  - **Auction Details Card:** Contains the auction title and description.
  - **Pricing and Duration Card:** Contains the starting price, minimum bid increment, and auction duration.

- **Bidder Management:**
  - Display a list of bidders including:
    - **ID** (unique identifier during bidding)
    - **Name**
    - **NRIC**
    - **Issuing Authority**
    - **Address**
  - Section to add new bidders:
    - A button to add a new bidder.
    - Input fields for:
      - **ID**
      - **Name**
      - **NRIC**
      - **Issuing Authority**
      - **Address**
    - If no ID is provided, the system will automatically assign the next sequential number based on the highest existing ID.

- **Start Auction:**
  - A button to initiate the auction.
  - On activation, the app transitions to the **Bidding Page**, transferring:
    - List of bidders
    - Starting price
    - Minimum bid increment
    - Auction title
    - Auction description

**IMPORTANT NOTICE:** Implement only the specified features with minimal effort—do not introduce any additional features, fields, or information beyond what is required.
