package tests

import (
	"github.com/stretchr/testify/mock"

	"auction/internal/models"
)

// MockDatabase is a mock implementation of database.Database
type MockDatabase struct {
	mock.Mock
}

// Initialize implements the Initialize method of the Database interface
func (m *MockDatabase) Initialize() error {
	args := m.Called()
	return args.Error(0)
}

// Close implements the Close method of the Database interface
func (m *MockDatabase) Close() error {
	args := m.Called()
	return args.Error(0)
}

// SaveData implements the SaveData method of the Database interface
func (m *MockDatabase) SaveData() error {
	args := m.Called()
	return args.Error(0)
}

// GetBidders retrieves bidders from the database
func (m *MockDatabase) GetBidders() ([]models.Bidder, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Bidder), args.Error(1)
}

// SetBidders updates bidders in the database
func (m *MockDatabase) SetBidders(bidders []models.Bidder) error {
	args := m.Called(bidders)
	return args.Error(0)
}

// GetAllAuctions retrieves all auctions from the database
func (m *MockDatabase) GetAllAuctions() (map[string]*models.Auction, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]*models.Auction), args.Error(1)
}

// GetAuction retrieves a specific auction by ID
func (m *MockDatabase) GetAuction(id string) (*models.Auction, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Auction), args.Error(1)
}

// CreateAuction creates a new auction
func (m *MockDatabase) CreateAuction(auction *models.Auction) error {
	args := m.Called(auction)
	return args.Error(0)
}

// UpdateAuction updates an existing auction
func (m *MockDatabase) UpdateAuction(id string, auction *models.Auction) error {
	args := m.Called(id, auction)
	return args.Error(0)
}

// DeleteAuction deletes an auction
func (m *MockDatabase) DeleteAuction(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

// ExportAuctionData exports auction data
func (m *MockDatabase) ExportAuctionData(id string) (*models.ExportData, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ExportData), args.Error(1)
}
