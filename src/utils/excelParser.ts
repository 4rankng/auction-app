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
    const bidders: Omit<Bidder, 'id'>[] = [];

    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Không thể đọc tệp Excel');
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let found = false;
        // Iterate through all sheets to find the desired data
        for (const sheetName of workbook.SheetNames) {
          const currentSheet = workbook.Sheets[sheetName];

          // Convert the sheet to JSON to make it easier to work with
          const jsonData = XLSX.utils.sheet_to_json(currentSheet, { header: 1 }) as any[][];

          if (!jsonData || jsonData.length === 0) {
            continue;
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
            continue;
          }

          logger.info(`Sheet: ${sheetName}; Header Row: ${headerRowIndex + 1}; Total Rows: ${jsonData.length}`);

          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Skip empty rows or rows without required data
            if (!row || !row[0] || !row[1]) {
              break;
            }

            // Validate and clean the data
            const name = String(row[1] || '').trim();
            const address = String(row[2] || '').trim();
            const nric = String(row[3] || '').trim();
            const phone = String(row[4] || '').trim();

            // Skip rows without required fields
            if (!name || !nric) {
              logger.warn(`Bỏ qua dòng ${i + 1} trong sheet "${sheetName}": Thiếu thông tin bắt buộc (tên hoặc CCCD/DKKD)`);
              continue;
            }

            let newBidder = {
              name,
              address,
              nric,
              issuingAuthority: '', // Not provided in the Excel, using empty string
              phone
            }
            logger.info(`Thêm người tham gia ${i - headerRowIndex}: ${JSON.stringify(newBidder)}`);
            bidders.push(newBidder);
          }

          if (bidders.length < 1) {
            continue;
          }
          resolve(bidders);
          found = true;
          break;
        }
        if (!found) {
          throw Error("Không tìm thấy dữ liệu người tham gia hợp lệ trong tệp Excel. Vui lòng kiểm tra lại định dạng bảng dữ liệu (phải có cột 'STT' và thông tin người tham gia).");
        }
      } catch (error) {
        logger.error('Lỗi khi xử lý tệp Excel:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Lỗi khi đọc tệp Excel. Vui lòng kiểm tra lại tệp và thử lại."));
    };

    reader.readAsArrayBuffer(file);
  });
};
