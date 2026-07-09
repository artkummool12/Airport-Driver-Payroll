export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Viewer' | 'Driver';
  phone: string;
  status: 'Active' | 'Inactive';
}

export interface Job {
  id: string;          // Job number e.g. D6762-02
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  vehicleCode: string; // Vehicle code e.g. Cam7BK-S
  route: string;       // e.g. เพลินจิต–แอร์สุ
  airport: string;     // สุวรรณภูมิ | ดอนเมือง | อื่นๆ
  flight: string;      // Flight number e.g. VJ801
  baseFare: number;    // Vehicle price rate
  bonus: number;       // Bonus amount
  penalty: number;     // Penalty amount
  tax: number;         // 5% tax calculated as (baseFare + bonus - penalty) * 0.05
  netIncome: number;   // Net income after tax
  createdBy: string;   // Creator Google Email
  createdDate: string; // Creation timestamp YYYY-MM-DD HH:MM
  isExternal?: boolean; // External job without tax deduction
  notes?: string;      // Remarks/notes
  isPaid?: boolean;    // Transferred / Paid status
}

export interface VehicleRate {
  vehicleCode: string; // e.g. Cam7BK-S
  description: string;
  price: number;
}

export interface BonusEntry {
  id: string;
  jobId: string;
  amount: number;
  remark: string;
}

export interface PenaltyEntry {
  id: string;
  jobId: string;
  amount: number;
  reason: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
}

export interface Car {
  id: string;            // UUID or system code
  code: string;          // ทะเบียนรถ/รหัสรถ เช่น D1299, D6662, D6762
  brand: string;         // ยี่ห้อ/รุ่น เช่น Toyota Camry
  licensePlate: string;  // ทะเบียนจริง เช่น 3กข 1299 กรุงเทพฯ
  imageUrl?: string;     // รูปภาพรถ (Base64 หรือ URL)
  createdAt?: string;
}

export type AppTab =
  | 'dashboard'
  | 'line-import'
  | 'jobs'
  | 'reports'
  | 'reports-daily'
  | 'reports-weekly'
  | 'reports-monthly'
  | 'rates'
  | 'bonus'
  | 'penalty'
  | 'cars'
  | 'users'
  | 'settings'
  | 'logs';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  sheets: string[];
  lastSynced?: string;
  status: 'disconnected' | 'connected' | 'syncing' | 'error';
  errorMessage?: string;
}

export function getCleanJobId(id: string): string {
  if (!id) return '';
  return id.split('_')[0];
}

