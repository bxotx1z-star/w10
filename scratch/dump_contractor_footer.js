const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const clientEmail = env['GOOGLE_CLIENT_EMAIL'];
const privateKey = env['GOOGLE_PRIVATE_KEY'];
const sheetId = env['GOOGLE_OT_CONTRACTOR_SHEET_ID'];

if (!clientEmail || !privateKey || !sheetId) {
  console.error('Missing Google Sheets environment variables');
  process.exit(1);
}

let sanitizedKey = privateKey;
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

const sheets = google.sheets({
  version: 'v4',
  auth,
});

async function dumpContractorFooter() {
  try {
    // Read a larger range to find the summary/footer row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'สรุปOT'!A30:AO100",
    });

    console.log('Contractor OT Potential Footer rows:');
    const rows = response.data.values || [];
    rows.forEach((row, i) => {
      // Look for rows that contain "รวม" or "สุทธิ"
      const rowStr = row.join(' ');
      if (rowStr.includes('รวม') || rowStr.includes('สุทธิ') || row.length > 30) {
         console.log(`Row ${i + 30}:`, row.map((cell, j) => `[${j}] ${cell}`).join(' | '));
      }
    });
  } catch (err) {
    console.error(err);
  }
}

dumpContractorFooter();
