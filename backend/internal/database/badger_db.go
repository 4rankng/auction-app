package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"

	"auction/internal/models"

	"github.com/dgraph-io/badger/v4"
)

type BadgerDB struct {
	db     *badger.DB
	logger *log.Logger
	mu     sync.RWMutex
}

func NewBadgerDB(dataDir string, logger *log.Logger) (*BadgerDB, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %v", err)
	}

	// Open BadgerDB with optimized settings
	opts := badger.DefaultOptions(filepath.Join(dataDir, "badger"))
	opts.Logger = nil // Disable Badger's internal logger
	opts.SyncWrites = true // Enable sync writes for better durability
	opts.ValueLogFileSize = 1 << 20 // 1MB, reduced from default 1GB

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open BadgerDB: %v", err)
	}

	return &BadgerDB{
		db:     db,
		logger: logger,
	}, nil
}

func (b *BadgerDB) Close() error {
	return b.db.Close()
}

func (b *BadgerDB) GetAuctionData() (*models.AuctionData, error) {
	var result *models.AuctionData
	err := b.withLock(func() error {
		var err error
		result, err = b.GetAuctionDataNoLock()
		return err
	})
	return result, err
}

func (b *BadgerDB) UpdateAuctionData(data *models.AuctionData) error {
	// Make a deep copy of the data to prevent race conditions
	dataCopy := &models.AuctionData{
		StartingPrice:  data.StartingPrice,
		PriceStep:      data.PriceStep,
		AuctionStatus:  data.AuctionStatus,
		CurrentRound:   data.CurrentRound,
		HighestBid:     data.HighestBid,
		HighestBidder:  data.HighestBidder,
		AuctionHistory: make([][]models.Bid, len(data.AuctionHistory)),
	}

	// Copy bidders
	if data.Bidders != nil {
		dataCopy.Bidders = make([]models.Bidder, len(data.Bidders))
		copy(dataCopy.Bidders, data.Bidders)
	}

	// Copy bid history
	if data.BidHistory != nil {
		dataCopy.BidHistory = make([]models.Bid, len(data.BidHistory))
		copy(dataCopy.BidHistory, data.BidHistory)
	}

	// Copy auction history (deep copy)
	for i, auction := range data.AuctionHistory {
		dataCopy.AuctionHistory[i] = make([]models.Bid, len(auction))
		copy(dataCopy.AuctionHistory[i], auction)
	}

	return b.withLock(func() error {
		return b.UpdateAuctionDataNoLock(dataCopy)
	})
}

// withLock executes a function while holding the lock and ensures it's released
func (b *BadgerDB) withLock(fn func() error) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	return fn()
}

// GetAuctionDataNoLock retrieves auction data without locking (must be called with lock held)
func (b *BadgerDB) GetAuctionDataNoLock() (*models.AuctionData, error) {
	var data models.AuctionData

	err := b.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("auction_data"))
		if err == badger.ErrKeyNotFound {
			// Return empty data if not found
			return nil
		}
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			return json.Unmarshal(val, &data)
		})
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get auction data: %v", err)
	}

	return &data, nil
}

// UpdateAuctionDataNoLock updates auction data without locking (must be called with lock held)
func (b *BadgerDB) UpdateAuctionDataNoLock(data *models.AuctionData) error {
	err := b.db.Update(func(txn *badger.Txn) error {
		bytes, err := json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal auction data: %v", err)
		}

		// Store data without TTL to ensure persistence
		if err := txn.Set([]byte("auction_data"), bytes); err != nil {
			return fmt.Errorf("failed to set auction data: %v", err)
		}

		return nil
	})

	if err != nil {
		b.logger.Printf("Error updating auction data: %v", err)
	}

	return err
}

// SaveData ensures that data is flushed to disk
func (b *BadgerDB) SaveData() error {
	// Force a flush to ensure data is written to disk
	err := b.db.Sync()
	if err != nil {
		b.logger.Printf("Error syncing database: %v", err)
	}
	return err
}

// Initialize sets up initial data if needed
func (b *BadgerDB) Initialize() error {
	data, err := b.GetAuctionData()
	if err != nil {
		return err
	}

	// If no data exists, create initial data
	if data == nil {
		initialData := &models.AuctionData{
			StartingPrice:  0,
			PriceStep:     0,
			AuctionStatus: "notStarted",
			CurrentRound:  0,
			Bidders:       []models.Bidder{},
			BidHistory:    []models.Bid{},
		}

		err = b.UpdateAuctionData(initialData)
		if err != nil {
			return fmt.Errorf("failed to initialize data: %v", err)
		}
	}

	return nil
}

// GetBidders returns all bidders from the auction data
func (b *BadgerDB) GetBidders() ([]models.Bidder, error) {
	data, err := b.GetAuctionData()
	if err != nil {
		return nil, err
	}
	return data.Bidders, nil
}

// SetBidders updates the bidders in the auction data
func (b *BadgerDB) SetBidders(bidders []models.Bidder) error {
	// Make a copy of the bidders to prevent race conditions
	biddersCopy := make([]models.Bidder, len(bidders))
	copy(biddersCopy, bidders)

	// Use a separate function to handle locking to ensure proper unlock
	return b.withLock(func() error {
		data, err := b.GetAuctionDataNoLock()
		if err != nil {
			return err
		}

		data.Bidders = biddersCopy
		return b.UpdateAuctionDataNoLock(data)
	})
}
