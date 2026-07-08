import React, { useState } from 'react';
import { Database, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface SpreadsheetSyncProps {
  isSyncing?: boolean;
  dbError?: string | null;
  onRefresh?: () => void;
}

export default function SpreadsheetSync({
  isSyncing = false,
  dbError = null,
  onRefresh,
}: SpreadsheetSyncProps) {
  const [loading, setLoading] = useState(false);

  const handleRefreshClick = async () => {
    if (!onRefresh) return;
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className={`bg-gradient-to-r rounded-2xl shadow-md border p-5 text-white ${
        dbError 
          ? 'from-rose-950 via-slate-900 to-slate-900 border-rose-500/20' 
          : 'from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
              dbError 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Database className="h-5.5 w-5.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
                ระบบจัดการฐานข้อมูล Supabase (100% Cloud Connected)
                {dbError ? (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-bold border border-rose-500/20">
                    <AlertCircle className="h-3 w-3 text-rose-400" /> เกิดข้อผิดพลาดในการเชื่อมต่อ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> เชื่อมต่อคลาวด์แบบเรียลไทม์
                  </span>
                )}
                {isSyncing && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/20 animate-pulse">
                    <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" /> กำลังบันทึกข้อมูล...
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 max-w-3xl">
                {dbError ? (
                  <span className="text-rose-300 font-medium">ข้อผิดพลาด: {dbError}</span>
                ) : (
                  <>
                    ระบบเชื่อมต่อโดยตรงกับฐานข้อมูล <span className="font-semibold text-emerald-400">Supabase SQL Cloud</span> เรียบร้อยแล้ว ข้อมูลทั้งหมด (เที่ยววิ่งงาน, อัตราจ้างพนักงาน, รายการโบนัส/ค่าปรับ, ทะเบียนรถ) ถูกจัดเก็บลงฐานข้อมูลคลาวด์โดยตรง ปลอดภัยและรวดเร็ว
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
            {onRefresh && (
              <button
                onClick={handleRefreshClick}
                disabled={loading || isSyncing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-emerald-400 text-slate-950 text-xs font-black rounded-xl border border-emerald-400 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                id="btn-refresh-data"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-950 ${loading ? 'animate-spin' : ''}`} />
                ดึงข้อมูลล่าสุดจากคลาวด์
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
