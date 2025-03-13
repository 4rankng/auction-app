import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import databaseService from '../../services/databaseService';
import { useToast } from '../../contexts/ToastContext';
import { Bidder } from '../../models/types';

interface BidderFormData {
  id: string;
  name: string;
  idNumber: string;
  issuingAuthority: string;
  address: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

interface BidderFormProps {
  onBidderAdded?: () => void;
  className?: string;
}

const BidderForm: React.FC<BidderFormProps> = ({ onBidderAdded, className = '' }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BidderFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const onSubmit = async (data: BidderFormData) => {
    setIsSubmitting(true);

    try {
      const bidderData: Bidder = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await databaseService.bidder.create(bidderData);

      reset();
      showToast('Bidder added successfully', 'success');

      if (onBidderAdded) {
        onBidderAdded();
      }
    } catch (error) {
      console.error('Error adding bidder:', error);
      showToast('Failed to add bidder', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        <Input
          label="Bidder ID"
          placeholder="Enter numeric bidder ID"
          error={errors.id?.message}
          fullWidth
          {...register('id', { required: 'Bidder ID is required' })}
        />

        <Input
          label="Name"
          placeholder="Enter bidder name"
          error={errors.name?.message}
          fullWidth
          {...register('name', { required: 'Name is required' })}
        />

        <Input
          label="ID Number"
          placeholder="Enter ID number"
          error={errors.idNumber?.message}
          fullWidth
          {...register('idNumber', { required: 'ID Number is required' })}
        />

        <Input
          label="Issuing Authority"
          placeholder="Enter issuing authority"
          error={errors.issuingAuthority?.message}
          fullWidth
          {...register('issuingAuthority', { required: 'Issuing Authority is required' })}
        />

        <Input
          label="Phone"
          placeholder="Enter phone number"
          error={errors.phone?.message}
          fullWidth
          {...register('phone', {
            pattern: {
              value: /^[0-9+\-\s()]*$/,
              message: 'Invalid phone number format'
            }
          })}
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter email address"
          error={errors.email?.message}
          fullWidth
          {...register('email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />

        <Input
          label="Address"
          placeholder="Enter address"
          error={errors.address?.message}
          fullWidth
          {...register('address', { required: 'Address is required' })}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Add Bidder
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BidderForm;
