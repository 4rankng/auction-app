import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import AuctionForm from '../components/auctions/AuctionForm';
import BidderForm from '../components/bidders/BidderForm';
import BidderList from '../components/bidders/BidderList';
import BidderImport from '../components/bidders/BidderImport';
import SettingsForm from '../components/settings/SettingsForm';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { Auction, Bidder } from '../models/types';
import { AUCTION_STATUS, ROUTES } from '../models/constants';

const SetupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddBidderModal, setShowAddBidderModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load bidders
        const allBidders = await databaseService.bidder.getAll();
        setBidders(allBidders);

        // If we have an auction ID, load that auction
        if (id) {
          const auctionData = await databaseService.auction.getById(id);
          if (auctionData) {
            setAuction(auctionData);
          } else {
            showToast('Auction not found', 'error');
            navigate(ROUTES.SETUP);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, showToast]);

  const handleAuctionSubmit = (newAuction: Auction) => {
    setAuction(newAuction);
    if (!id) {
      navigate(`${ROUTES.SETUP}/${newAuction.id}`);
    }
  };

  const handleBidderAdded = async () => {
    try {
      const allBidders = await databaseService.bidder.getAll();
      setBidders(allBidders);
      setShowAddBidderModal(false);
    } catch (error) {
      console.error('Error reloading bidders:', error);
    }
  };

  const handleStartAuction = async () => {
    if (!auction) return;

    setIsStarting(true);

    try {
      const updatedAuction = await databaseService.auction.start(auction.id);
      showToast('Auction started successfully', 'success');
      navigate(`${ROUTES.BID}/${updatedAuction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      showToast('Failed to start auction', 'error');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Auction' : 'Create New Auction'}
        </h1>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={() => setShowSettingsModal(true)}
          >
            Settings
          </Button>
          {auction && auction.status === AUCTION_STATUS.SETUP && (
            <Button
              variant="success"
              onClick={handleStartAuction}
              isLoading={isStarting}
              disabled={isStarting}
            >
              Start Auction
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Auction Details">
            <AuctionForm
              auction={auction || undefined}
              onSubmitSuccess={handleAuctionSubmit}
            />
          </Card>
        </div>

        <div>
          <Card
            title="Bidders"
            footer={
              <div className="flex justify-between w-full">
                <Button
                  variant="secondary"
                  onClick={() => setShowImportModal(true)}
                >
                  Import CSV
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowAddBidderModal(true)}
                >
                  Add Bidder
                </Button>
              </div>
            }
          >
            <BidderList
              bidders={bidders}
              onSelectBidder={() => {}}
            />
          </Card>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Auction Settings"
      >
        <SettingsForm onSubmitSuccess={() => setShowSettingsModal(false)} />
      </Modal>

      {/* Import Bidders Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Bidders"
      >
        <BidderImport onImportSuccess={() => {
          handleBidderAdded();
          setShowImportModal(false);
        }} />
      </Modal>

      {/* Add Bidder Modal */}
      <Modal
        isOpen={showAddBidderModal}
        onClose={() => setShowAddBidderModal(false)}
        title="Add Bidder"
      >
        <BidderForm onBidderAdded={handleBidderAdded} />
      </Modal>
    </div>
  );
};

export default SetupPage;
