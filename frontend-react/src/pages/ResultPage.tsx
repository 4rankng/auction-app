import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import BidHistory from '../components/bids/BidHistory';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { AuctionResult } from '../models/types';
import { ROUTES } from '../models/constants';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [result, setResult] = useState<AuctionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      if (!id) {
        navigate(ROUTES.HOME);
        return;
      }

      setIsLoading(true);

      try {
        const auctionResult = await databaseService.auction.getResult(id);

        if (!auctionResult) {
          showToast('Auction result not found', 'error');
          navigate(ROUTES.HOME);
          return;
        }

        setResult(auctionResult);
      } catch (error) {
        console.error('Error loading auction result:', error);
        showToast('Failed to load auction result', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [id, navigate, showToast]);

  if (isLoading) {
    return <Loading fullScreen text="Loading result..." />;
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Result Not Found</h2>
        <p className="text-gray-600 mb-6">The auction result you're looking for doesn't exist</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.HOME)}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auction Result</h1>
        <Link to={ROUTES.HOME}>
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Auction Summary">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="font-medium">{databaseService.formatCurrency(result.startingPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Final Price</p>
                  <p className="font-medium text-green-600">{databaseService.formatCurrency(result.finalPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-medium">{new Date(result.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="font-medium">{new Date(result.endTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="font-medium">{result.totalBids}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Bidders</p>
                  <p className="font-medium">{result.totalBidders}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Winner</h3>
                {result.winner ? (
                  <div className="flex items-center bg-green-50 p-4 rounded-md">
                    <div className="flex-shrink-0 h-16 w-16">
                      <img
                        className="h-16 w-16 rounded-full"
                        src={result.winner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.winner.name)}&background=random&size=64`}
                        alt={result.winner.name}
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{result.winner.name}</h4>
                      {result.winner.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="inline-block mr-1">
                            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </span>
                          {result.winner.phone}
                        </p>
                      )}
                      {result.winner.email && (
                        <p className="text-sm text-gray-600">
                          <span className="inline-block mr-1">
                            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </span>
                          {result.winner.email}
                        </p>
                      )}
                      {result.winner.address && (
                        <p className="text-sm text-gray-600">
                          <span className="inline-block mr-1">
                            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </span>
                          {result.winner.address}
                        </p>
                      )}
                      <p className="mt-2 text-lg font-medium text-green-600">
                        Winning Bid: {databaseService.formatCurrency(result.finalPrice)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-yellow-600">No winner (no bids were placed)</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Bid History">
            <BidHistory bids={result.bidHistory} />
          </Card>
        </div>

        <div>
          <Card title="Actions">
            <div className="space-y-4 p-4">
              <Link to={ROUTES.HOME} className="block">
                <Button variant="primary" fullWidth>
                  Back to Home
                </Button>
              </Link>

              <Link to={ROUTES.SETUP} className="block">
                <Button variant="secondary" fullWidth>
                  Create New Auction
                </Button>
              </Link>

              <Button
                variant="success"
                fullWidth
                onClick={() => {
                  // Print the result
                  window.print();
                }}
              >
                Print Result
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
