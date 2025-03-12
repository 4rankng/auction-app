package database

import "auction/internal/models"

// Database defines the interface for database operations
type Database interface {
	// Core database methods
	Initialize() error
	SaveData() error
	Close() error

	// Auction methods
	GetAllAuctions() (map[string]*models.Auction, error)
	GetAuction(id string) (*models.Auction, error)
	CreateAuction(auction *models.Auction) error
	UpdateAuction(id string, auction *models.Auction) error
	DeleteAuction(id string) error
	ExportAuctionData(id string) (*models.ExportData, error)

	// Bidder methods
	GetBidders() ([]models.Bidder, error)
	SetBidders([]models.Bidder) error
}

// Ensure TinyDB implements Database interface
var _ Database = (*TinyDB)(nil)
