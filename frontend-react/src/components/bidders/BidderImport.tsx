import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import databaseService from '../../services/databaseService';
import { useToast } from '../../contexts/ToastContext';

interface BidderImportProps {
  onImportSuccess?: () => void;
  className?: string;
}

const BidderImport: React.FC<BidderImportProps> = ({
  onImportSuccess,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showToast('Please select a CSV file', 'warning');
      return;
    }

    setIsUploading(true);

    try {
      const content = await readFileContent(file);
      const bidders = await databaseService.bidder.importFromCSV(content);

      showToast(`Successfully imported ${bidders.length} bidders`, 'success');

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName(null);

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('Error importing bidders:', error);
      showToast('Failed to import bidders', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-md p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Bidders from CSV</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Upload a CSV file with bidder information. The file should have the following columns:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
          <li>name (required)</li>
          <li>phone (optional)</li>
          <li>email (optional)</li>
          <li>address (optional)</li>
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CSV File
        </label>
        <div className="flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
            id="bidder-csv-upload"
          />
          <label
            htmlFor="bidder-csv-upload"
            className="cursor-pointer py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Choose File
          </label>
          <span className="ml-3 text-sm text-gray-500">
            {fileName || 'No file selected'}
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={handleImport}
        isLoading={isUploading}
        disabled={isUploading || !fileName}
      >
        Import Bidders
      </Button>

      <div className="mt-4">
        <p className="text-xs text-gray-500">
          Example CSV format:
          <br />
          <code>name,phone,email,address</code>
          <br />
          <code>John Doe,0987654321,john@example.com,123 Main St</code>
          <br />
          <code>Jane Smith,0123456789,jane@example.com,456 Oak Ave</code>
        </p>
      </div>
    </div>
  );
};

export default BidderImport;
