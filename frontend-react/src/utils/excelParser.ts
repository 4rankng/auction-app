import * as XLSX from 'xlsx';
import { Bidder } from '../types';

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
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Look for the sheet named "Đủ ĐK"
        const sheetName = "Đủ ĐK";
        if (!workbook.SheetNames.includes(sheetName)) {
          throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert the sheet to JSON to make it easier to work with
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Find the row that contains "STT" as the first cell
        const headerRowIndex = jsonData.findIndex(row =>
          row[0] === "STT" &&
          row[1] === "Họ tên" &&
          row[2] === "Địa chỉ" &&
          row[3] === "Giấy CMND/CCCD/ĐKDN" &&
          row[4] === "Số điện thoại"
        );

        if (headerRowIndex === -1) {
          throw new Error("Could not find the table header with 'STT' in the Excel file");
        }

        // Extract bidder data from rows below the header
        const bidders: Omit<Bidder, 'id'>[] = [];

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Check if we've reached the end of the table (any empty cell)
          if (!row || row.length < 5 || !row[0] || !row[1] || !row[2] || !row[3] || !row[4]) {
            break;
          }

          bidders.push({
            name: row[1],
            address: row[2],
            nric: row[3],
            issuingAuthority: '', // Not provided in the Excel, using empty string
            phone: row[4]
          });
        }

        if (bidders.length === 0) {
          throw new Error("No valid bidder data found in the Excel file");
        }

        resolve(bidders);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the Excel file"));
    };

    reader.readAsArrayBuffer(file);
  });
};
