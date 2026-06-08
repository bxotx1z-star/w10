const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  });
}

function getSheetsClientForSheet(sheetId) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey || !sheetId) {
    console.error('Missing Google Sheets environment variables');
    return null;
  }

  let sanitizedKey = privateKey.replace(/^"(.*)"$/, '$1');
  const keyStart = sanitizedKey.indexOf('-----BEGIN PRIVATE KEY-----');

  if (keyStart !== -1) {
    sanitizedKey = sanitizedKey.substring(keyStart);
  }

  sanitizedKey = sanitizedKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: sanitizedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheetId,
    sheets: google.sheets({
      version: 'v4',
      auth,
    }),
  };
}

async function main() {
  const employeeSheetId = process.env.GOOGLE_OT_EMPLOYEE_SHEET_ID;
  const contractorSheetId = process.env.GOOGLE_OT_CONTRACTOR_SHEET_ID || '1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ';

  console.log('--- Employee Check OT Error ---');
  const empClient = getSheetsClientForSheet(employeeSheetId);
  try {
    const response = await empClient.sheets.spreadsheets.values.get({
      spreadsheetId: employeeSheetId,
      range: "'Check OT Error'!B2:AK25",
    });
    const rows = response.data.values || [];
    rows.slice(0, 10).forEach((row, idx) => {
      console.log(`Row ${idx}: [${row.slice(0, 8).map(x => `'${x}'`).join(', ')}] ... TotalCol='${row[row.length - 1]}'`);
    });
  } catch (err) {
    console.error('Employee Error:', err.message);
  }

  console.log('\n--- Contractor Check OT Error ---');
  const conClient = getSheetsClientForSheet(contractorSheetId);
  try {
    const response = await conClient.sheets.spreadsheets.values.get({
      spreadsheetId: contractorSheetId,
      range: "'Check OT Error'!B2:AJ35",
    });
    const rows = response.data.values || [];
    rows.slice(0, 10).forEach((row, idx) => {
      console.log(`Row ${idx}: [${row.slice(0, 8).map(x => `'${x}'`).join(', ')}] ... TotalCol='${row[row.length - 1]}'`);
    });
  } catch (err) {
    console.error('Contractor Error:', err.message);
  }
}

main().catch(console.error);
