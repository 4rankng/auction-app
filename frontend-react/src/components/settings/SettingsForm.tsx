import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import databaseService from '../../services/databaseService';
import { useToast } from '../../contexts/ToastContext';
import { Settings } from '../../models/types';
import { DEFAULT_SETTINGS } from '../../models/constants';

interface SettingsFormProps {
  onSubmitSuccess?: (settings: Settings) => void;
  className?: string;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  onSubmitSuccess,
  className = ''
}) => {
  const currentSettings = databaseService.settings.get();

  const { register, handleSubmit, formState: { errors } } = useForm<Settings>({
    defaultValues: currentSettings
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { showToast } = useToast();

  const onSubmit = async (data: Settings) => {
    setIsSubmitting(true);

    try {
      const updatedSettings = await databaseService.settings.update(data);

      showToast('Settings updated successfully', 'success');

      if (onSubmitSuccess) {
        onSubmitSuccess(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);

    try {
      const defaultSettings = await databaseService.settings.reset();

      showToast('Settings reset to default values', 'success');

      if (onSubmitSuccess) {
        onSubmitSuccess(defaultSettings);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast('Failed to reset settings', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        <Input
          label="Initial Price (VND)"
          type="number"
          placeholder={`Default: ${DEFAULT_SETTINGS.INITIAL_PRICE.toLocaleString()} VND`}
          error={errors.initialPrice?.message}
          fullWidth
          {...register('initialPrice', {
            required: 'Initial price is required',
            min: {
              value: 1000,
              message: 'Initial price must be at least 1,000 VND'
            },
            valueAsNumber: true
          })}
        />

        <Input
          label="Price Increment (VND)"
          type="number"
          placeholder={`Default: ${DEFAULT_SETTINGS.PRICE_INCREMENT.toLocaleString()} VND`}
          error={errors.priceIncrement?.message}
          fullWidth
          {...register('priceIncrement', {
            required: 'Price increment is required',
            min: {
              value: 1000,
              message: 'Price increment must be at least 1,000 VND'
            },
            valueAsNumber: true
          })}
        />

        <Input
          label="Auction Duration (seconds)"
          type="number"
          placeholder={`Default: ${DEFAULT_SETTINGS.AUCTION_DURATION} seconds`}
          error={errors.auctionDuration?.message}
          fullWidth
          {...register('auctionDuration', {
            required: 'Auction duration is required',
            min: {
              value: 30,
              message: 'Auction duration must be at least 30 seconds'
            },
            valueAsNumber: true
          })}
        />

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || isResetting}
          >
            Save Settings
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            isLoading={isResetting}
            disabled={isSubmitting || isResetting}
            onClick={handleReset}
          >
            Reset to Default
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SettingsForm;
