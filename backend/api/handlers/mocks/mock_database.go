// Package mocks provides mock implementations for testing
package mocks

import (
	"auction/internal/models"
	"fmt"
)

// MockDB implements the Database interface for testing
type MockDB struct {
	auctions map[string]*models.Auction
}

// NewMockDB creates a new mock database instance
func NewMockDB() *MockDB {
	return &MockDB{
		auctions: make(map[string]*models.Auction),
	}
}

// Initialize implements Database.Initialize
func (m *MockDB) Initialize() error {
	return nil
}

// Close implements Database.Close
func (m *MockDB) Close() error {
	return nil
}

// SaveData implements Database.SaveData
func (m *MockDB) SaveData() error {
	return nil
}

// GetBidders implements Database.GetBidders
func (m *MockDB) GetBidders() ([]models.Bidder, error) {
	var bidders []models.Bidder
	// If there's a current auction, return its bidders
	for _, auction := range m.auctions {
		bidders = append(bidders, auction.Bidders...)
	}
	return bidders, nil
}

// SetBidders implements Database.SetBidders
func (m *MockDB) SetBidders(bidders []models.Bidder) error {
	for _, auction := range m.auctions {
		auction.Bidders = bidders
		break // Just set it for the first auction
	}
	return nil
}

// GetAllAuctions implements Database.GetAllAuctions
func (m *MockDB) GetAllAuctions() (map[string]*models.Auction, error) {
	return m.auctions, nil
}

// GetAuction implements Database.GetAuction
func (m *MockDB) GetAuction(id string) (*models.Auction, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, &models.ErrorNotFound{Message: fmt.Sprintf("auction with ID %s not found", id)}
	}
	return auction, nil
}

// CreateAuction implements Database.CreateAuction
func (m *MockDB) CreateAuction(auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot create nil auction")
	}
	if _, exists := m.auctions[auction.ID]; exists {
		return fmt.Errorf("auction with ID %s already exists", auction.ID)
	}
	m.auctions[auction.ID] = auction
	return nil
}

// UpdateAuction implements Database.UpdateAuction
func (m *MockDB) UpdateAuction(id string, auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot update with nil auction")
	}
	if _, exists := m.auctions[id]; !exists {
		return &models.ErrorNotFound{Message: fmt.Sprintf("auction with ID %s not found", id)}
	}
	m.auctions[id] = auction
	return nil
}

// DeleteAuction implements Database.DeleteAuction
func (m *MockDB) DeleteAuction(id string) error {
	if _, exists := m.auctions[id]; !exists {
		return &models.ErrorNotFound{Message: fmt.Sprintf("auction with ID %s not found", id)}
	}
	delete(m.auctions, id)
	return nil
}

// ExportAuctionData implements Database.ExportAuctionData
func (m *MockDB) ExportAuctionData(id string) (*models.ExportData, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, &models.ErrorNotFound{Message: fmt.Sprintf("auction with ID %s not found", id)}
	}

	exportData := &models.ExportData{
		AuctionID:     auction.ID,
		Title:         auction.Title,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		BidHistory:    auction.BidHistory,
		TotalBids:     len(auction.BidHistory),
		WinnerID:      auction.HighestBidder,
		WinningBid:    auction.HighestBid,
	}

	return exportData, nil
}
