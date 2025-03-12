package tests

import (
	"github.com/stretchr/testify/mock"

	"auction/internal/models"
)

// MockDatabase is a mock implementation of the database.Database interface
type MockDatabase struct {
	mock.Mock
}

// Initialize mocks the Initialize method
func (m *MockDatabase) Initialize() error {
	args := m.Called()
	return args.Error(0)
}

// Close mocks the Close method
func (m *MockDatabase) Close() error {
	args := m.Called()
	return args.Error(0)
}

// SaveData mocks the SaveData method
func (m *MockDatabase) SaveData() error {
	args := m.Called()
	return args.Error(0)
}

// GetBidders mocks the GetBidders method
func (m *MockDatabase) GetBidders() ([]models.Bidder, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Bidder), args.Error(1)
}

// SetBidders mocks the SetBidders method
func (m *MockDatabase) SetBidders(bidders []models.Bidder) error {
	args := m.Called(bidders)
	return args.Error(0)
}

// GetAllAuctions mocks the GetAllAuctions method
func (m *MockDatabase) GetAllAuctions() (map[string]*models.Auction, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]*models.Auction), args.Error(1)
}

// GetAuction mocks the GetAuction method
func (m *MockDatabase) GetAuction(auctionID string) (*models.Auction, error) {
	args := m.Called(auctionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Auction), args.Error(1)
}

// CreateAuction mocks the CreateAuction method
func (m *MockDatabase) CreateAuction(auction *models.Auction) error {
	args := m.Called(auction)
	return args.Error(0)
}

// UpdateAuction mocks the UpdateAuction method
func (m *MockDatabase) UpdateAuction(auctionID string, auction *models.Auction) error {
	args := m.Called(auctionID, auction)
	return args.Error(0)
}

// DeleteAuction mocks the DeleteAuction method
func (m *MockDatabase) DeleteAuction(auctionID string) error {
	args := m.Called(auctionID)
	return args.Error(0)
}

// ExportAuctionData mocks the ExportAuctionData method
func (m *MockDatabase) ExportAuctionData(auctionID string) (*models.ExportData, error) {
	args := m.Called(auctionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ExportData), args.Error(1)
}
