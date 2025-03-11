package models

import "time"

// Bidder struct defines the structure of a bidder
type Bidder struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
}

// Bid represents a single bid in the auction
type Bid struct {
	Round       int       `json:"round"`
	BidderID    string    `json:"bidderId"`
	BidderName  string    `json:"bidderName"`
	Amount      int       `json:"amount"`
	Timestamp   time.Time `json:"timestamp"`
}

// AuctionData is the main data structure that will be stored in JSON
type AuctionData struct {
	Bidders        []Bidder `json:"bidders"`
	StartingPrice  int      `json:"startingPrice"`
	PriceStep      int      `json:"priceStep"`
	BidHistory     []Bid    `json:"bidHistory"`
	AuctionHistory [][]Bid  `json:"auctionHistory"` // Store completed auctions' history
	CurrentRound   int      `json:"currentRound"`
	HighestBid     int      `json:"highestBid"`
	HighestBidder  string   `json:"highestBidder"`
	AuctionStatus  string   `json:"auctionStatus"` // "notStarted", "inProgress", "completed"
}
