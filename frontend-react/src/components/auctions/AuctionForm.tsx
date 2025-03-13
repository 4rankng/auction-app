import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import databaseService from '../../services/databaseService';
import { useToast } from '../../contexts/ToastContext';
import { Auction } from '../../models/types';
import { AUCTION_STATUS } from '../../models/constants';

interface AuctionFormData {
  title: string;
  description: string;
  startingPrice: number;
  priceStep: number;
}

interface AuctionFormProps {
  auction?: Auction;
  onSubmitSuccess?: (auction: Auction) => void;
  className?: string;
}

const AuctionForm: React.FC<AuctionFormProps> = ({
  auction,
  onSubmitSuccess,
  className = ''
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AuctionFormData>({
    defaultValues: auction ? {
      title: auction.title,
      description: auction.description || '',
      startingPrice: auction.startingPrice,
      priceStep: auction.priceStep
    } : {
      startingPrice: databaseService.settings.get().initialPrice,
      priceStep: databaseService.settings.get().priceIncrement
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const onSubmit = async (data: AuctionFormData) => {
    setIsSubmitting(true);

    try {
      let result: Auction;

      if (auction) {
        // Update existing auction
        result = await databaseService.auction.update(auction.id, {
          title: data.title,
          description: data.description,
          startingPrice: data.startingPrice,
          priceStep: data.priceStep,
          currentPrice: data.startingPrice // Reset current price to starting price
        });

        showToast('Auction updated successfully', 'success');
      } else {
        // Create new auction
        result = await databaseService.auction.create({
          title: data.title,
          description: data.description,
          status: AUCTION_STATUS.SETUP,
          startingPrice: data.startingPrice,
          currentPrice: data.startingPrice,
          priceStep: data.priceStep
        });

        showToast('Auction created successfully', 'success');
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (error) {
      console.error('Error saving auction:', error);
      showToast('Failed to save auction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="Enter auction title"
          error={errors.title?.message}
          fullWidth
          {...register('title', { required: 'Title is required' })}
        />

        <Textarea
          label="Description"
          placeholder="Enter auction description"
          error={errors.description?.message}
          fullWidth
          {...register('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Starting Price (VND)"
            type="number"
            placeholder="Enter starting price"
            error={errors.startingPrice?.message}
            fullWidth
            {...register('startingPrice', {
              required: 'Starting price is required',
              min: {
                value: 1000,
                message: 'Starting price must be at least 1,000 VND'
              },
              valueAsNumber: true
            })}
          />

          <Input
            label="Price Step (VND)"
            type="number"
            placeholder="Enter price step"
            error={errors.priceStep?.message}
            fullWidth
            {...register('priceStep', {
              required: 'Price step is required',
              min: {
                value: 1000,
                message: 'Price step must be at least 1,000 VND'
              },
              valueAsNumber: true
            })}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {auction ? 'Update Auction' : 'Create Auction'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AuctionForm;
