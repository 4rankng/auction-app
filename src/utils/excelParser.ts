import * as XLSX from 'xlsx';
import { Bidder } from '@types';
import logger from '@services/loggerService';

/**
 * Parses an Excel file to extract bidder data according to the specified format.
 * Looks for a table in the "Đủ ĐK" sheet that starts with a cell containing "STT".
 *
 * @param file - The Excel file to parse
 * @returns A promise that resolves to an array of bidder data
 */
export const parseBiddersFromExcel = async (file: File): Promise<Omit<Bidder, 'id'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read Excel file');
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Look for the sheet named "Đủ ĐK"
        const sheetName = "Đủ ĐK";
        if (!workbook.SheetNames.includes(sheetName)) {
          throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert the sheet to JSON to make it easier to work with
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          throw new Error('Excel file is empty or has invalid format');
        }

        const normalize = (text: any): string => {
          if (text === undefined || text === null) {
            return "";
          }
          // Convert to string and normalize
          return String(text).normalize('NFC').trim().toLowerCase();
        };

        // Find the row that contains "STT" as the first cell
        const headerRowIndex = jsonData.findIndex(row =>
          row &&
          row.length >= 2 &&
          normalize(row[0]) === "stt" &&
          normalize(row[1]) !== ""
        );

        if (headerRowIndex === -1) {
          throw new Error("Could not find the table header with 'STT' in the Excel file");
        }

        // Extract bidder data from rows below the header
        const bidders: Omit<Bidder, 'id'>[] = [];
        logger.info(`Header Row: ${headerRowIndex}; Total Rows: ${jsonData.length}`);

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Skip empty rows or rows without required data
          if (!row || !row[0] || !row[1]) {
            continue;
          }

          // Validate and clean the data
          const name = String(row[1] || '').trim();
          const address = String(row[2] || '').trim();
          const nric = String(row[3] || '').trim();
          const phone = String(row[4] || '').trim();

          // Skip rows without required fields
          if (!name || !nric) {
            logger.warn(`Skipping row ${i + 1}: Missing required fields (name or NRIC)`);
            continue;
          }

          bidders.push({
            name,
            address,
            nric,
            issuingAuthority: '', // Not provided in the Excel, using empty string
            phone
          });
        }

        if (bidders.length === 0) {
          throw new Error("No valid bidder data found in the Excel file");
        }

        resolve(bidders);
      } catch (error) {
        logger.error('Error parsing Excel file:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the Excel file"));
    };

    reader.readAsArrayBuffer(file);
  });
};
