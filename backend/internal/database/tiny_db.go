package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"auction/common"
	"auction/internal/models"
)

// TinyDB implements a simple JSON file-based database
type TinyDB struct {
	dataDir     string
	dataFile    string
	logger      *log.Logger
	mu          sync.RWMutex
	auctionData *models.AuctionData
	initialized bool
}

// NewTinyDB creates a new instance of TinyDB
func NewTinyDB(dataDir string, logger *log.Logger) (*TinyDB, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %v", err)
	}

	return &TinyDB{
		dataDir:  dataDir,
		dataFile: filepath.Join(dataDir, "auction_data.json"),
		logger:   logger,
		auctionData: &models.AuctionData{
			Auctions:       make(map[string]*models.Auction),
			CurrentAuction: "",
		},
		initialized: false,
	}, nil
}

// Close implements Database.Close
func (t *TinyDB) Close() error {
	// Save data before closing
	return t.SaveData()
}

// SaveData implements Database.SaveData
func (t *TinyDB) SaveData() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	return t.saveDataNoLock()
}

// saveDataNoLock saves data to file without acquiring the lock
func (t *TinyDB) saveDataNoLock() error {
	// Marshal data to JSON
	data, err := json.MarshalIndent(t.auctionData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal auction data: %v", err)
	}

	// Write to temporary file first
	tempFile := t.dataFile + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write to temporary file: %v", err)
	}

	// Rename temporary file to actual file (atomic operation)
	if err := os.Rename(tempFile, t.dataFile); err != nil {
		return fmt.Errorf("failed to rename temporary file: %v", err)
	}

	return nil
}

// loadData loads data from file
func (t *TinyDB) loadData() error {
	// Check if file exists
	if _, err := os.Stat(t.dataFile); os.IsNotExist(err) {
		// File doesn't exist, use default data
		t.initialized = true
		return nil
	}

	// Read file
	data, err := os.ReadFile(t.dataFile)
	if err != nil {
		return fmt.Errorf("failed to read data file: %v", err)
	}

	// Unmarshal data
	if len(data) > 0 {
		err = json.Unmarshal(data, t.auctionData)
		if err != nil {
			return fmt.Errorf("failed to unmarshal auction data: %v", err)
		}
	}

	// Initialize auctions map if it's nil
	if t.auctionData.Auctions == nil {
		t.auctionData.Auctions = make(map[string]*models.Auction)
	}

	t.initialized = true
	return nil
}

// Initialize implements Database.Initialize
func (t *TinyDB) Initialize() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Check if file exists
	if _, err := os.Stat(t.dataFile); os.IsNotExist(err) {
		// File doesn't exist, create it with default data
		if err := t.saveDataNoLock(); err != nil {
			return fmt.Errorf("failed to initialize database: %v", err)
		}
		t.initialized = true
		return nil
	}

	// File exists, load data
	if err := t.loadData(); err != nil {
		return fmt.Errorf("failed to initialize database: %v", err)
	}

	return nil
}

// GetBidders retrieves all bidders from all auctions
func (t *TinyDB) GetBidders() ([]models.Bidder, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return nil, err
		}
	}

	// If current auction is set, return bidders from that auction
	if t.auctionData.CurrentAuction != "" {
		if auction, exists := t.auctionData.Auctions[t.auctionData.CurrentAuction]; exists {
			return auction.Bidders, nil
		}
	}

	// Otherwise, return empty list
	return []models.Bidder{}, nil
}

// SetBidders sets bidders for the current auction
func (t *TinyDB) SetBidders(bidders []models.Bidder) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return err
		}
	}

	// If current auction is set, update bidders for that auction
	if t.auctionData.CurrentAuction != "" {
		if auction, exists := t.auctionData.Auctions[t.auctionData.CurrentAuction]; exists {
			auction.Bidders = bidders
			return t.saveDataNoLock()
		}
		return fmt.Errorf("current auction not found")
	}

	return fmt.Errorf("no current auction set")
}

// GetAllAuctions implements Database.GetAllAuctions
func (t *TinyDB) GetAllAuctions() (map[string]*models.Auction, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return nil, err
		}
	}

	return t.auctionData.Auctions, nil
}

// GetAuction implements Database.GetAuction
func (t *TinyDB) GetAuction(id string) (*models.Auction, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return nil, err
		}
	}

	// Check if auction exists
	auction, exists := t.auctionData.Auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}

	return auction, nil
}

// CreateAuction implements Database.CreateAuction
func (t *TinyDB) CreateAuction(auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot create nil auction")
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return err
		}
	}

	// Check if auction ID already exists
	if _, exists := t.auctionData.Auctions[auction.ID]; exists {
		return fmt.Errorf("auction with ID %s already exists", auction.ID)
	}

	// Add auction to map
	t.auctionData.Auctions[auction.ID] = auction

	// Save to file
	return t.saveDataNoLock()
}

// UpdateAuction implements Database.UpdateAuction
func (t *TinyDB) UpdateAuction(id string, auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot update with nil auction")
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return err
		}
	}

	// Check if auction exists
	if _, exists := t.auctionData.Auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	// Update auction
	t.auctionData.Auctions[id] = auction

	// Save to file
	return t.saveDataNoLock()
}

// DeleteAuction implements Database.DeleteAuction
func (t *TinyDB) DeleteAuction(id string) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return err
		}
	}

	// Check if auction exists
	if _, exists := t.auctionData.Auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	// Delete auction
	delete(t.auctionData.Auctions, id)

	// Save to file
	return t.saveDataNoLock()
}

// ExportAuctionData implements Database.ExportAuctionData
func (t *TinyDB) ExportAuctionData(id string) (*models.ExportData, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Load data if not initialized
	if !t.initialized {
		if err := t.loadData(); err != nil {
			return nil, err
		}
	}

	// Check if auction exists
	auction, exists := t.auctionData.Auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}

	// Check if auction is completed
	if auction.AuctionStatus != common.Completed {
		return nil, fmt.Errorf("cannot export data for auction that is not completed")
	}

	// Find winner information
	var winnerName string
	for _, bidder := range auction.Bidders {
		if bidder.ID == auction.HighestBidder {
			winnerName = bidder.Name
			break
		}
	}

	// Create export data
	exportData := &models.ExportData{
		AuctionID:     auction.ID,
		Title:         auction.Title,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		TotalBids:     len(auction.BidHistory),
		BidHistory:    auction.BidHistory,
		WinnerID:      auction.HighestBidder,
		WinnerName:    winnerName,
		WinningBid:    auction.HighestBid,
		EndTime:       time.Now(), // Ideally this would be stored in the auction data
	}

	return exportData, nil
}

// Ensure TinyDB implements Database interface
var _ Database = (*TinyDB)(nil)
