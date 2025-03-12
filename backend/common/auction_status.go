package common

// AuctionStatus represents the status of an auction
type AuctionStatus string

// Enum values for AuctionStatus
const (
	NotStarted AuctionStatus = "notStarted"
	InProgress AuctionStatus = "inProgress"
	Completed  AuctionStatus = "completed"
)
