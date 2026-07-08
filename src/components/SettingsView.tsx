import React, { useState } from 'react';
import {
  Settings,
  HelpCircle,
  Database,
  Terminal,
  RefreshCw,
  Sparkles,
  ClipboardCheck,
  Check,
  Server,
  Key,
  ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  isSyncing: boolean;
}

export default function SettingsView({ isSyncing }: SettingsViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const supabaseUrl = 'https://ypwcxnswkdrdnntpfvmj.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwd2N4bnN3a2RyZG5udHBmdm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Nzk3NTksImV4cCI6MjA5OTA1NTc1OX0.Df3cQ6LYKpZtxFZyqJWvsU69UmHP_GNdiPHlN997mq4';

  const sqlSchema = `-- 1. สร้างตารางเก็บข้อมูลพนักงานขับรถ (user_accounts)
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Viewer', 'Driver')),
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

-- 2. สร้างตารางอัตราค่าบริการรถ (vehicle_rates)
CREATE TABLE IF NOT EXISTS vehicle_rates (
  vehicle_code TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0
);

-- 3. สร้างตารางเที่ยวงานหลัก (jobs)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time TEXT NOT NULL, -- HH:MM
  vehicle_code TEXT NOT NULL,
  route TEXT NOT NULL,
  airport TEXT NOT NULL,
  flight TEXT NOT NULL DEFAULT '',
  base_fare NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  penalty NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  net_income NUMERIC NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_date TEXT NOT NULL DEFAULT ''
);

-- 4. สร้างตารางโบนัสรายได้เสริม (bonus_entries)
CREATE TABLE IF NOT EXISTS bonus_entries (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  remark TEXT NOT NULL DEFAULT ''
);

-- 5. สร้างตารางค่าปรับ (penalty_entries)
CREATE TABLE IF NOT EXISTS penalty_entries (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT ''
);

-- 6. ปิดการทำงานของระบบ RLS (Row Level Security) เพื่ออนุญาตการเชื่อมต่อ API Anon ใช้งาน
ALTER TABLE user_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_entries DISABLE ROW LEVEL SECURITY;`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Settings and Database Definitions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Settings className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">คู่มือโครงสร้างฐานข้อมูล Supabase</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Database className="h-4 w-4 text-emerald-600" />
                โครงสร้างตารางฐานข้อมูล SQL ทั้งหมด (Supabase SQL Script)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                คัดลอกชุดสคริปต์ SQL นี้แล้วนำไปรันที่เมนู **SQL Editor** บนแดชบอร์ด Supabase ของคุณเพื่อสร้างตารางข้อมูลและปิดการ RLS ให้แอปและ API สามารถสื่อสารได้อย่างเสถียร:
              </p>

              <div className="mt-3 relative">
                <button
                  onClick={() => copyToClipboard(sqlSchema, 'sql')}
                  className="absolute right-3 top-3 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  id="btn-copy-sql"
                >
                  {copied === 'sql' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-3.5 w-3.5 text-slate-500" /> คัดลอกโค้ด SQL
                    </>
                  )}
                </button>
                <pre className="bg-slate-950 text-slate-300 font-mono text-[10.5px] p-5 rounded-2xl border border-slate-800 max-h-96 overflow-y-auto leading-relaxed">
                  {sqlSchema}
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                สิทธิ์การเข้าใช้งานและจัดเก็บข้อมูล (API Client Permissions)
              </h5>
              <p className="text-[11px] text-slate-500 leading-normal">
                - ตารางทั้งหมดได้รับการตั้งชื่อตามมาตรฐาน Camel/Snake Case คอลัมน์ทุกช่องสอดคล้องกับ Object data structure ในแอปพลิเคชัน 100%<br />
                - คำสั่ง `DISABLE ROW LEVEL SECURITY` ช่วยเพิ่มประสิทธิภาพการทดสอบและรันแอปพลิเคชันได้ทันทีโดยไม่ต้องเชื่อมต่อระบบ auth ยุ่งยาก
              </p>
            </div>
          </div>
        </div>

        {/* Database Control Side Panel */}
        <div className="space-y-6">
          {/* Supabase Connection details info card */}
          <div className="bg-slate-55 bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white space-y-4">
            <h4 className="text-xs font-black flex items-center gap-1.5 text-indigo-300 uppercase tracking-wider">
              <Server className="h-4.5 w-4.5 text-emerald-400" />
              การกำหนดค่าการเชื่อมต่อ
            </h4>
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">API URL Endpoint</p>
                <div className="flex items-center gap-1 mt-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg">
                  <span className="font-mono text-[10px] text-slate-300 truncate flex-1">{supabaseUrl}</span>
                  <button onClick={() => copyToClipboard(supabaseUrl, 'url')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    {copied === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Anon Public Key</p>
                <div className="flex items-center gap-1 mt-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg">
                  <span className="font-mono text-[10px] text-slate-300 truncate flex-1">{supabaseKey}</span>
                  <button onClick={() => copyToClipboard(supabaseKey, 'key')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    {copied === 'key' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
              สถานะความปลอดภัยคลาวด์
            </h4>
            <p className="text-slate-500 leading-relaxed">
              ระบบนี้ได้รับการกำหนดค่าให้บันทึกและสืบค้นข้อมูลโดยตรงจากฐานข้อมูลระบบคลาวด์ของ Supabase ตลอดเวลา (ไม่มีการเก็บสำรองลงในบราวเซอร์หรือโหมดออฟไลน์อีกต่อไป) ข้อมูลทั้งหมดมีความเสถียรและเชื่อมโยงกันอย่างเรียลไทม์
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
