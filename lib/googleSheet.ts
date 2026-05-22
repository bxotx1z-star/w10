import { google } from 'googleapis';

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

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
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return {
    sheetId,
    sheets: google.sheets({
      version: 'v4',
      auth,
    }),
  };
}

export async function getDashboardData() {
  const client = getSheetsClient();

  if (!client) return null;

  try {

    // ดึง 2 ชีทพร้อมกัน
    const [dashboardRes, infoRes] = await Promise.all([

      client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "'Dashboard W10 All'!A1:CZ1000",
      }),

      client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "'Dashboard W10 All info'!A1:CZ1000",
      }),

    ]);

    return {
      dashboard: dashboardRes.data.values || [],
      info: infoRes.data.values || [],
    };

  } catch (error: any) {

    console.error('Google Sheets API error:', error.message);

    return null;
  }
}