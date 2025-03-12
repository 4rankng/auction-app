# Auction App Product Specification

## Overview

The Auction App is a robust auction platform designed to create a seamless experience for both auction creators and bidders. This spec outlines a clear, no-compromise architecture that guarantees operational excellence and user satisfaction throughout the auction lifecycle.

## Technology Stack

- **Backend Server**
  - **Language:** Go
  - **Framework:** Gin
  - **Database:** tinydb

- **Web Server**
  - **Technologies:** HTML, CSS, JavaScript
  - **Libraries:** Bootstrap, Axios

## Core Features

### Backend Endpoints

The backend is built with precision and covers all critical auction functionalities:

- **Auction Management**
  - **Create an Auction:** Initialize a new auction with initial price, step price, list of bidders, and auction start time.
  - **Get All Auctions:** Retrieve a list of all auctions.
  - **Get a Single Auction:** Fetch detailed information on a specific auction.
  - **Start an Auction:** Activate the auction for bidding.
  - **End an Auction:** Conclude the bidding process.
  - **Export Auction Data:** Provide a mechanism to export auction information.

- **Bidding Operations**
  - **Place a Bid:** Allow users to submit bids on an auction.
  - **Get Current Bids:** Retrieve the latest bids for an active auction.
  - **Get Auction History:** Display the complete history of an auction.

- **Additional Functionality**
  - **Excel File Parsing:** Process an Excel file to extract and return a list of bidders (without affecting the database).

### Web Server Pages

The web server delivers an intuitive, user-centric experience through dedicated pages:

- **index.html**
  - Displays all completed auctions.
  - Provides an interface to create new auctions.

- **setup.html**
  - Configures auction details before the auction starts.
  - **Features:**
    - A button labeled “Bat Dau Dau Gia” to start the auction and transition to the bidding phase.
    - Input fields for "Gia Khoi Diem" and "Buoc Gia" that automatically format numbers using commas (e.g., entering `1000000` displays as `1,000,000`).
    - Data collection from text fields, including conversion of comma-separated numbers to integers.
    - Retrieval and management of "Danh Sach Nguoi Tham Gia" (participant list), with options to delete or edit each record.
    - An optional "Ma Nguoi Tham Gia" field which, if left empty, auto-increments based on the last entry.

- **bid.html**
  - Facilitates the bidding process.
  - **Features:**
    - A button labeled “Ket Thuc Dau Gia” to end the auction and transition to the result display.
    - Similar data collection and conversion procedures as in setup.html, ensuring consistency in bid processing.

- **result.html**
  - Displays the auction winner prominently.
  - Shows a complete history of the auction.
  - Provides a button to return to the index page for a fresh start.

## Navigation Logic

The app smartly redirects users based on the state of the last inserted auction in the database:

- **Auction Not Started:** Any page request redirects to **index.html**.
- **Auction In Progress:** Requests redirect to **bid.html**.
- **Auction Ended:** Requests redirect to **result.html**.

