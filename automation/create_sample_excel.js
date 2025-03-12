const ExcelJS = require('exceljs');
const path = require('path');
const chalk = require('chalk');

async function createSampleBiddersExcel(outputPath = path.join(__dirname, 'sample_bidders.xlsx')) {
  console.log(chalk.blue(`Creating sample bidders Excel file at: ${outputPath}`));

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bidders');

  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Address', key: 'address', width: 50 }
  ];

  // Add style to headers
  worksheet.getRow(1).font = { bold: true };

  // Add sample bidders data
  const bidders = [
    { id: '1', name: 'Alice Johnson', address: 'New York, USA' },
    { id: '2', name: 'Bob Smith', address: 'San Francisco, USA' },
    { id: '3', name: 'Charlie Brown', address: 'Chicago, USA' },
    { id: '4', name: 'Diana Prince', address: 'Boston, USA' },
    { id: '5', name: 'Edward Norton', address: 'Los Angeles, USA' }
  ];

  // Add rows to the worksheet
  bidders.forEach(bidder => {
    worksheet.addRow(bidder);
  });

  // Save the workbook to a file
  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log(chalk.green(`Sample Excel file created successfully at: ${outputPath}`));
    return outputPath;
  } catch (error) {
    console.error(chalk.red(`Error creating Excel file: ${error.message}`));
    throw error;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createSampleBiddersExcel()
    .then(filePath => {
      console.log(chalk.green(`Sample Excel file created at: ${filePath}`));
    })
    .catch(err => {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    });
} else {
  // Export the function for use in other scripts
  module.exports = createSampleBiddersExcel;
}
