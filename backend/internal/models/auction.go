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
	Round      int       `json:"round"`
	BidderID   string    `json:"bidderId"`
	BidderName string    `json:"bidderName"`
	Amount     int       `json:"amount"`
	Timestamp  time.Time `json:"timestamp"`
}

// Auction represents a single auction with all its data
type Auction struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	CreatedAt     time.Time `json:"createdAt"`
	Bidders       []Bidder  `json:"bidders"`
	StartingPrice int       `json:"startingPrice"`
	PriceStep     int       `json:"priceStep"`
	BidHistory    []Bid     `json:"bidHistory"`
	CurrentRound  int       `json:"currentRound"`
	HighestBid    int       `json:"highestBid"`
	HighestBidder string    `json:"highestBidder"`
	AuctionStatus string    `json:"auctionStatus"` // "notStarted", "inProgress", "completed"
}

// AuctionData is the main data structure that will be stored in JSON
type AuctionData struct {
	// Multi-auction support
	Auctions       map[string]*Auction `json:"auctions"`
	CurrentAuction string              `json:"currentAuction"`
}

// ExportData represents the data structure for exporting auction results
type ExportData struct {
	AuctionID     string    `json:"auctionId"`
	Title         string    `json:"title"`
	StartingPrice int       `json:"startingPrice"`
	PriceStep     int       `json:"priceStep"`
	TotalBids     int       `json:"totalBids"`
	BidHistory    []Bid     `json:"bidHistory"`
	WinnerID      string    `json:"winnerId"`
	WinnerName    string    `json:"winnerName"`
	WinningBid    int       `json:"winningBid"`
	EndTime       time.Time `json:"endTime"`
}
