import { UserAccount, Job, VehicleRate, BonusEntry, PenaltyEntry, SystemLog } from '../types';

const API_BASE = 'https://sheets.googleapis.com';

// Standard sheet names matching Thai requirements exactly
export const SHEET_USERS = 'Users';
export const SHEET_JOBS = 'Jobs';
export const SHEET_VEHICLE_RATES = 'VehicleRates';
export const SHEET_BONUS = 'Bonus';
export const SHEET_PENALTY = 'Penalty';
export const SHEET_SETTINGS = 'Settings';
export const SHEET_LOGS = 'Logs';

interface GoogleSheetResponse {
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      title: string;
    };
  }>;
}

// Helper for making Google API requests
async function googleFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    let message = `Google Sheets API Error (${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch (_) {}
    throw new Error(message);
  }
  return response.json();
}

// Fetch spreadsheet info and check what sheets exist
export async function fetchSpreadsheetInfo(spreadsheetId: string, token: string) {
  const data: GoogleSheetResponse = await googleFetch(
    `${API_BASE}/v4/spreadsheets/${spreadsheetId}`,
    token
  );

  return {
    id: spreadsheetId,
    title: data.properties.title,
    sheets: data.sheets.map(s => s.properties.title),
  };
}

// Create the necessary sheets with headers if they don't exist
export async function initializeSpreadsheet(spreadsheetId: string, token: string, existingSheets: string[]) {
  const requests: any[] = [];

  // Add missing sheets
  const required = [SHEET_USERS, SHEET_JOBS, SHEET_VEHICLE_RATES, SHEET_BONUS, SHEET_PENALTY, SHEET_SETTINGS, SHEET_LOGS];
  for (const sheetName of required) {
    if (!existingSheets.includes(sheetName)) {
      requests.push({
        addSheet: {
          properties: {
            title: sheetName,
            gridProperties: {
              rowCount: 2000,
              columnCount: 20,
            },
          },
        },
      });
    }
  }

  // If we have sheets to add, run the batch update
  if (requests.length > 0) {
    await googleFetch(`${API_BASE}/v4/spreadsheets/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  // Set headers for each sheet (always overwrite headers to ensure correctness)
  const headersMap = {
    [SHEET_USERS]: [
      ['User ID', 'Name', 'Email', 'Role']
    ],
    [SHEET_JOBS]: [
      ['Job ID', 'Date', 'Time', 'Vehicle Code', 'Route', 'Airport', 'Flight', 'Base Fare', 'Bonus', 'Penalty', 'Tax (5%)', 'Net Income', 'Created By', 'Created Date']
    ],
    [SHEET_VEHICLE_RATES]: [
      ['Vehicle Code', 'Description', 'Price']
    ],
    [SHEET_BONUS]: [
      ['Bonus ID', 'Job ID', 'Amount', 'Remark']
    ],
    [SHEET_PENALTY]: [
      ['Penalty ID', 'Job ID', 'Amount', 'Reason']
    ],
    [SHEET_SETTINGS]: [
      ['Setting Key', 'Setting Value']
    ],
    [SHEET_LOGS]: [
      ['Log ID', 'Timestamp', 'User Email', 'Action', 'Details']
    ],
  };

  const valueRanges = Object.entries(headersMap).map(([sheet, values]) => ({
    range: `${sheet}!A1:N1`,
    values,
  }));

  await googleFetch(`${API_BASE}/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    }),
  });
}

// Read data from a specific range
async function readSheetValues(spreadsheetId: string, range: string, token: string): Promise<any[][]> {
  try {
    const data = await googleFetch(`${API_BASE}/v4/spreadsheets/${spreadsheetId}/values/${range}`, token);
    return data.values || [];
  } catch (error) {
    console.error(`Error reading range ${range}:`, error);
    return [];
  }
}

// Write (overwrite) values to a specific range
async function writeSheetValues(spreadsheetId: string, range: string, values: any[][], token: string) {
  // First clear the range to ensure stale rows are deleted
  await googleFetch(`${API_BASE}/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, token, {
    method: 'POST',
  });

  // Then write the new values
  if (values.length === 0) return;

  await googleFetch(`${API_BASE}/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, token, {
    method: 'PUT',
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });
}

// USERS API
export async function getUsersFromSheet(spreadsheetId: string, token: string): Promise<UserAccount[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_USERS}!A2:F1000`, token);
  return rows.map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] as 'Admin' | 'Manager' | 'Viewer' | 'Driver') || 'Driver',
    phone: row[4] || '-',
    status: (row[5] as 'Active' | 'Inactive') || 'Active',
  })).filter(u => u.id);
}

export async function saveUsersToSheet(spreadsheetId: string, token: string, users: UserAccount[]) {
  const values = users.map(u => [u.id, u.name, u.email, u.role, u.phone || '-', u.status || 'Active']);
  await writeSheetValues(spreadsheetId, `${SHEET_USERS}!A2:F1000`, values, token);
}

// JOBS API
export async function getJobsFromSheet(spreadsheetId: string, token: string): Promise<Job[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_JOBS}!A2:N2000`, token);
  return rows.map(row => ({
    id: row[0] || '',
    date: row[1] || '',
    time: row[2] || '',
    vehicleCode: row[3] || '',
    route: row[4] || '',
    airport: row[5] || '',
    flight: row[6] || '',
    baseFare: parseFloat(row[7]) || 0,
    bonus: parseFloat(row[8]) || 0,
    penalty: parseFloat(row[9]) || 0,
    tax: parseFloat(row[10]) || 0,
    netIncome: parseFloat(row[11]) || 0,
    createdBy: row[12] || '',
    createdDate: row[13] || '',
  })).filter(j => j.id);
}

export async function saveJobsToSheet(spreadsheetId: string, token: string, jobs: Job[]) {
  const values = jobs.map(j => [
    j.id,
    j.date,
    j.time,
    j.vehicleCode,
    j.route,
    j.airport,
    j.flight || '',
    j.baseFare,
    j.bonus,
    j.penalty,
    j.tax,
    j.netIncome,
    j.createdBy,
    j.createdDate,
  ]);
  await writeSheetValues(spreadsheetId, `${SHEET_JOBS}!A2:N2000`, values, token);
}

// VEHICLE RATES API
export async function getRatesFromSheet(spreadsheetId: string, token: string): Promise<VehicleRate[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_VEHICLE_RATES}!A2:C500`, token);
  return rows.map(row => ({
    vehicleCode: row[0] || '',
    description: row[1] || '',
    price: parseFloat(row[2]) || 0,
  })).filter(r => r.vehicleCode);
}

export async function saveRatesToSheet(spreadsheetId: string, token: string, rates: VehicleRate[]) {
  const values = rates.map(r => [r.vehicleCode, r.description, r.price]);
  await writeSheetValues(spreadsheetId, `${SHEET_VEHICLE_RATES}!A2:C500`, values, token);
}

// BONUS API
export async function getBonusFromSheet(spreadsheetId: string, token: string): Promise<BonusEntry[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_BONUS}!A2:D500`, token);
  return rows.map(row => ({
    id: row[0] || '',
    jobId: row[1] || '',
    amount: parseFloat(row[2]) || 0,
    remark: row[3] || '',
  })).filter(b => b.id);
}

export async function saveBonusToSheet(spreadsheetId: string, token: string, bonuses: BonusEntry[]) {
  const values = bonuses.map(b => [b.id, b.jobId, b.amount, b.remark]);
  await writeSheetValues(spreadsheetId, `${SHEET_BONUS}!A2:D500`, values, token);
}

// PENALTY API
export async function getPenaltyFromSheet(spreadsheetId: string, token: string): Promise<PenaltyEntry[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_PENALTY}!A2:D500`, token);
  return rows.map(row => ({
    id: row[0] || '',
    jobId: row[1] || '',
    amount: parseFloat(row[2]) || 0,
    reason: row[3] || '',
  })).filter(p => p.id);
}

export async function savePenaltyToSheet(spreadsheetId: string, token: string, penalties: PenaltyEntry[]) {
  const values = penalties.map(p => [p.id, p.jobId, p.amount, p.reason]);
  await writeSheetValues(spreadsheetId, `${SHEET_PENALTY}!A2:D500`, values, token);
}

// LOGS API
export async function getLogsFromSheet(spreadsheetId: string, token: string): Promise<SystemLog[]> {
  const rows = await readSheetValues(spreadsheetId, `${SHEET_LOGS}!A2:E2000`, token);
  return rows.map(row => ({
    id: row[0] || '',
    timestamp: row[1] || '',
    userEmail: row[2] || '',
    action: row[3] || '',
    details: row[4] || '',
  })).filter(l => l.id);
}

export async function saveLogsToSheet(spreadsheetId: string, token: string, logs: SystemLog[]) {
  const values = logs.map(l => [l.id, l.timestamp, l.userEmail, l.action, l.details]);
  await writeSheetValues(spreadsheetId, `${SHEET_LOGS}!A2:E2000`, values, token);
}
