package database

import "auction/internal/models"

// Database defines the interface for database operations
type Database interface {
	GetAuctionData() (*models.AuctionData, error)
	UpdateAuctionData(*models.AuctionData) error
	SaveData() error
	Initialize() error
	Close() error
	GetBidders() ([]models.Bidder, error)
	SetBidders([]models.Bidder) error
}

// Ensure BadgerDB implements Database interface
var _ Database = (*BadgerDB)(nil)
