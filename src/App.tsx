import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { UserAccount, Job, VehicleRate, BonusEntry, PenaltyEntry, AppTab } from './types';
import SpreadsheetSync from './components/SpreadsheetSync';
import DashboardView from './components/DashboardView';
import LineImportView from './components/LineImportView';
import JobsView from './components/JobsView';
import RatesView from './components/RatesView';
import BonusView from './components/BonusView';
import PenaltyView from './components/PenaltyView';
import ReportsView from './components/ReportsView';
import DriversView from './components/DriversView';
import SettingsView from './components/SettingsView';
import {
  LayoutDashboard,
  Clipboard,
  Briefcase,
  Percent,
  Award,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  Database,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


// Translation functions
const mapJobFromDB = (j: any): Job => ({
  id: j.id,
  date: j.date || '',
  time: j.time || '',
  vehicleCode: j.vehicle_code || '',
  route: j.route || '',
  airport: j.airport || '',
  flight: j.flight || '',
  baseFare: Number(j.base_fare) || 0,
  bonus: Number(j.bonus) || 0,
  penalty: Number(j.penalty) || 0,
  tax: Number(j.tax) || 0,
  netIncome: Number(j.net_income) || 0,
  createdBy: j.created_by || '',
  createdDate: j.created_date || ''
});

const mapJobToDB = (j: Job) => ({
  id: j.id,
  date: j.date || '',
  time: j.time || '',
  vehicle_code: j.vehicleCode || '',
  route: j.route || '',
  airport: j.airport || '',
  flight: j.flight || '',
  base_fare: Number(j.baseFare) || 0,
  bonus: Number(j.bonus) || 0,
  penalty: Number(j.penalty) || 0,
  tax: Number(j.tax) || 0,
  net_income: Number(j.netIncome) || 0,
  created_by: j.createdBy || '',
  created_date: j.createdDate || ''
});

const mapRateFromDB = (r: any): VehicleRate => ({
  vehicleCode: r.vehicle_code || '',
  description: r.description || '',
  price: Number(r.price) || 0
});

const mapRateToDB = (r: VehicleRate) => ({
  vehicle_code: r.vehicleCode || '',
  description: r.description || '',
  price: Number(r.price) || 0
});

const mapBonusFromDB = (b: any): BonusEntry => ({
  id: b.id,
  jobId: b.job_id || '',
  amount: Number(b.amount) || 0,
  remark: b.remark || ''
});

const mapBonusToDB = (b: BonusEntry) => ({
  id: b.id,
  job_id: b.jobId || '',
  amount: Number(b.amount) || 0,
  remark: b.remark || ''
});

const mapPenaltyFromDB = (p: any): PenaltyEntry => ({
  id: p.id,
  jobId: p.job_id || '',
  amount: Number(p.amount) || 0,
  reason: p.reason || ''
});

const mapPenaltyToDB = (p: PenaltyEntry) => ({
  id: p.id,
  job_id: p.jobId || '',
  amount: Number(p.amount) || 0,
  reason: p.reason || ''
});

export default function App() {
  // Navigation (Default to dashboard)
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const scrollMobileNav = (direction: 'left' | 'right') => {
    if (mobileNavRef.current) {
      const scrollAmount = 180;
      mobileNavRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setTimeout(() => {
      const activeEl = document.getElementById(`mobile-tab-${tab}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  };

  // Sync / Supabase State
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // App Data State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rates, setRates] = useState<VehicleRate[]>([]);
  const [bonuses, setBonuses] = useState<BonusEntry[]>([]);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);

  // Fetch all values from Supabase Cloud DB
  const loadSupabaseData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Fetch Users
      const { data: dbUsers, error: usersErr } = await supabase.from('user_accounts').select('*');
      if (usersErr) throw usersErr;

      // Fetch Rates
      const { data: dbRates, error: ratesErr } = await supabase.from('vehicle_rates').select('*');
      if (ratesErr) throw ratesErr;

      // Fetch Jobs
      const { data: dbJobs, error: jobsErr } = await supabase.from('jobs').select('*');
      if (jobsErr) throw jobsErr;

      // Fetch Bonuses
      const { data: dbBonuses, error: bonusErr } = await supabase.from('bonus_entries').select('*');
      if (bonusErr) throw bonusErr;

      // Fetch Penalties
      const { data: dbPenalties, error: penaltyErr } = await supabase.from('penalty_entries').select('*');
      if (penaltyErr) throw penaltyErr;

      const mappedUsers = (dbUsers || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        status: u.status
      }));

      const mappedRates = (dbRates || []).map(mapRateFromDB);
      const mappedJobs = (dbJobs || []).map(mapJobFromDB);
      const mappedBonuses = (dbBonuses || []).map(mapBonusFromDB);
      const mappedPenalties = (dbPenalties || []).map(mapPenaltyFromDB);

      setUsers(mappedUsers);
      setRates(mappedRates);
      setJobs(mappedJobs);
      setBonuses(mappedBonuses);
      setPenalties(mappedPenalties);

      setDbError(null);
    } catch (err: any) {
      console.error('Supabase fetch failed:', err.message || err);
      setDbError(err.message || 'โปรดตรวจสอบความถูกต้องของฐานข้อมูล Supabase (ตารางอาจยังไม่ได้สร้าง)');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load database on Mount
  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // CALLBACK DIRECTORIES
  const handleSaveDriver = async (userAcc: UserAccount) => {
    setIsSyncing(true);
    try {
      let generatedId = userAcc.id;
      if (!generatedId) {
        generatedId = `USR-${Math.floor(100 + Math.random() * 900)}`;
      }
      const dbPayload = {
        id: generatedId,
        name: userAcc.name,
        email: userAcc.email,
        role: userAcc.role,
        phone: userAcc.phone || '',
        status: userAcc.status || 'Active'
      };
      const { error } = await supabase.from('user_accounts').upsert(dbPayload);
      if (error) throw error;
      
      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกพนักงานขับรถได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDriver = async (email: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('user_accounts').delete().eq('email', email);
      if (error) throw error;
      
      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถลบพนักงานขับรถได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveJob = async (job: Job) => {
    setIsSyncing(true);
    try {
      const dbPayload = mapJobToDB(job);
      const { error } = await supabase.from('jobs').upsert(dbPayload);
      if (error) throw error;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกงานวิ่งได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถลบงานวิ่งได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveRate = async (rate: VehicleRate) => {
    setIsSyncing(true);
    try {
      const dbPayload = mapRateToDB(rate);
      const { error } = await supabase.from('vehicle_rates').upsert(dbPayload);
      if (error) throw error;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกอัตราค่าจ้างได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRate = async (vehicleCode: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('vehicle_rates').delete().eq('vehicle_code', vehicleCode);
      if (error) throw error;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถลบอัตราค่าจ้างได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Bonus CRUD & Job Aggregations Sync
  const handleSaveBonus = async (bonus: BonusEntry) => {
    setIsSyncing(true);
    try {
      const dbPayload = mapBonusToDB(bonus);
      const { error } = await supabase.from('bonus_entries').upsert(dbPayload);
      if (error) throw error;

      // Recalculate aggregates
      const { data: jobBonuses, error: bErr } = await supabase.from('bonus_entries').select('amount').eq('job_id', bonus.jobId);
      if (bErr) throw bErr;
      const { data: jobPenalties, error: pErr } = await supabase.from('penalty_entries').select('amount').eq('job_id', bonus.jobId);
      if (pErr) throw pErr;

      const totalBonus = (jobBonuses || []).reduce((sum, b) => sum + Number(b.amount), 0);
      const totalPenalty = (jobPenalties || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: jobData, error: jErr } = await supabase.from('jobs').select('base_fare').eq('id', bonus.jobId).single();
      if (jErr) throw jErr;

      const baseFare = Number(jobData.base_fare);
      const tax = Number(((baseFare + totalBonus - totalPenalty) * 0.05).toFixed(2));
      const netIncome = Number(((baseFare + totalBonus - totalPenalty) - tax).toFixed(2));

      const { error: updErr } = await supabase.from('jobs').update({
        bonus: totalBonus,
        penalty: totalPenalty,
        tax,
        net_income: netIncome
      }).eq('id', bonus.jobId);
      if (updErr) throw updErr;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกโบนัสได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteBonus = async (id: string) => {
    setIsSyncing(true);
    try {
      const { data: target, error: getErr } = await supabase.from('bonus_entries').select('job_id').eq('id', id).single();
      if (getErr) throw getErr;
      const jobId = target.job_id;

      const { error: delErr } = await supabase.from('bonus_entries').delete().eq('id', id);
      if (delErr) throw delErr;

      // Recalculate aggregates
      const { data: jobBonuses } = await supabase.from('bonus_entries').select('amount').eq('job_id', jobId);
      const { data: jobPenalties } = await supabase.from('penalty_entries').select('amount').eq('job_id', jobId);

      const totalBonus = (jobBonuses || []).reduce((sum, b) => sum + Number(b.amount), 0);
      const totalPenalty = (jobPenalties || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: jobData } = await supabase.from('jobs').select('base_fare').eq('id', jobId).single();
      const baseFare = jobData ? Number(jobData.base_fare) : 0;
      const tax = Number(((baseFare + totalBonus - totalPenalty) * 0.05).toFixed(2));
      const netIncome = Number(((baseFare + totalBonus - totalPenalty) - tax).toFixed(2));

      await supabase.from('jobs').update({
        bonus: totalBonus,
        penalty: totalPenalty,
        tax,
        net_income: netIncome
      }).eq('id', jobId);

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถลบโบนัสได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Penalty CRUD & Job Aggregations Sync
  const handleSavePenalty = async (penalty: PenaltyEntry) => {
    setIsSyncing(true);
    try {
      const dbPayload = mapPenaltyToDB(penalty);
      const { error } = await supabase.from('penalty_entries').upsert(dbPayload);
      if (error) throw error;

      // Recalculate aggregates
      const { data: jobBonuses } = await supabase.from('bonus_entries').select('amount').eq('job_id', penalty.jobId);
      const { data: jobPenalties } = await supabase.from('penalty_entries').select('amount').eq('job_id', penalty.jobId);

      const totalBonus = (jobBonuses || []).reduce((sum, b) => sum + Number(b.amount), 0);
      const totalPenalty = (jobPenalties || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: jobData } = await supabase.from('jobs').select('base_fare').eq('id', penalty.jobId).single();
      const baseFare = jobData ? Number(jobData.base_fare) : 0;
      const tax = Number(((baseFare + totalBonus - totalPenalty) * 0.05).toFixed(2));
      const netIncome = Number(((baseFare + totalBonus - totalPenalty) - tax).toFixed(2));

      await supabase.from('jobs').update({
        bonus: totalBonus,
        penalty: totalPenalty,
        tax,
        net_income: netIncome
      }).eq('id', penalty.jobId);

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกค่าปรับได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeletePenalty = async (id: string) => {
    setIsSyncing(true);
    try {
      const { data: target, error: getErr } = await supabase.from('penalty_entries').select('job_id').eq('id', id).single();
      if (getErr) throw getErr;
      const jobId = target.job_id;

      const { error: delErr } = await supabase.from('penalty_entries').delete().eq('id', id);
      if (delErr) throw delErr;

      // Recalculate aggregates
      const { data: jobBonuses } = await supabase.from('bonus_entries').select('amount').eq('job_id', jobId);
      const { data: jobPenalties } = await supabase.from('penalty_entries').select('amount').eq('job_id', jobId);

      const totalBonus = (jobBonuses || []).reduce((sum, b) => sum + Number(b.amount), 0);
      const totalPenalty = (jobPenalties || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: jobData } = await supabase.from('jobs').select('base_fare').eq('id', jobId).single();
      const baseFare = jobData ? Number(jobData.base_fare) : 0;
      const tax = Number(((baseFare + totalBonus - totalPenalty) * 0.05).toFixed(2));
      const netIncome = Number(((baseFare + totalBonus - totalPenalty) - tax).toFixed(2));

      await supabase.from('jobs').update({
        bonus: totalBonus,
        penalty: totalPenalty,
        tax,
        net_income: netIncome
      }).eq('id', jobId);

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถลบค่าปรับได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Bulk import parsed jobs
  const handleImportJobs = async (importedJobs: Job[]) => {
    setIsSyncing(true);
    try {
      const dbPayloads = importedJobs.map(mapJobToDB);
      const { error } = await supabase.from('jobs').upsert(dbPayloads);
      if (error) throw error;

      await loadSupabaseData();
    } catch (err: any) {
      alert(`ไม่สามารถนำเข้าข้อมูลวิ่งงานได้: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* 100% Localized Header */}
      <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md border-b border-indigo-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
              <Database className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 uppercase font-mono">
                ระบบคำนวณเงินพนักงานขับรถรับส่งสนามบิน <span className="text-[9px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-bold normal-case tracking-normal">Supabase Cloud</span>
              </h1>
              <p className="text-[10px] text-indigo-200">คำนวณผลตอบแทนอัตโนมัติ หักภาษี ณ ที่จ่าย 5% ซิงค์เรียลไทม์ผ่านฐานข้อมูล Supabase SQL</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dbError ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                  เชื่อมต่อล้มเหลว (Supabase Offline)
                </span>
                <button
                  onClick={() => loadSupabaseData()}
                  className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  title="ลองเชื่อมต่อฐานข้อมูล Supabase ใหม่อีกครั้ง"
                >
                  <RefreshCw className="h-3 w-3 animate-spin" /> เชื่อมต่อใหม่
                </button>
              </div>
            ) : (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                เชื่อมต่อระบบคลาวด์แล้ว (Supabase Online)
              </span>
            )}
            <div className="flex items-center gap-2 text-xs bg-indigo-900/50 border border-indigo-700/50 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-200 font-medium font-mono">it.sumino.apico@gmail.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {/* Spreadsheet Status Header Card */}
        <SpreadsheetSync
          isSyncing={isSyncing}
          dbError={dbError}
          onRefresh={() => loadSupabaseData()}
        />

        {/* 100% Thai Navigation Menu (Desktop) */}
        <div className="hidden md:flex flex-wrap border-b border-slate-200 mb-6 bg-white rounded-xl shadow-xs border border-slate-100 p-2 gap-2 w-full justify-start">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
            id="tab-dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            แผงควบคุมหลัก
          </button>

          <button
            onClick={() => setActiveTab('line-import')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'line-import'
                ? 'bg-emerald-600 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
            id="tab-line-import"
          >
            <Clipboard className="h-4 w-4" />
            นำเข้าจาก LINE
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'jobs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-jobs"
          >
            <Briefcase className="h-4 w-4" />
            ตารางเที่ยววิ่ง ({jobs.length})
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'rates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-rates"
          >
            <Percent className="h-4 w-4" />
            อัตราค่ารถ
          </button>

          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'bonus'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-bonus"
          >
            <Award className="h-4 w-4" />
            เงินบวกเพิ่ม
          </button>

          <button
            onClick={() => setActiveTab('penalty')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'penalty'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-penalty"
          >
            <AlertTriangle className="h-4 w-4" />
            รายการค่าปรับ
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-reports"
          >
            <FileText className="h-4 w-4" />
            สรุปรายงานการคำนวณเงิน
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-users"
          >
            <Users className="h-4 w-4" />
            รายชื่อพนักงาน
          </button>
        </div>

        {/* 100% Thai Navigation Menu (Mobile Bottom Nav) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-2.5 flex items-center gap-1 z-50">
          {/* Left Arrow Button */}
          <button
            onClick={() => scrollMobileNav('left')}
            className="flex items-center justify-center h-8 w-8 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="เลื่อนซ้าย"
            id="mobile-nav-scroll-left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scrollable container */}
          <div
            ref={mobileNavRef}
            className="flex-grow flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-none scroll-smooth touch-pan-x py-0.5"
          >
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-slate-950 shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-dashboard"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              แผงควบคุม
            </button>

            <button
              onClick={() => handleTabChange('line-import')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'line-import'
                  ? 'bg-emerald-600 text-slate-950 shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-line-import"
            >
              <Clipboard className="h-4 w-4 shrink-0" />
              นำเข้า LINE
            </button>

            <button
              onClick={() => handleTabChange('jobs')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-jobs"
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              ตารางวิ่งงาน ({jobs.length})
            </button>

            <button
              onClick={() => handleTabChange('rates')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'rates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-rates"
            >
              <Percent className="h-4 w-4 shrink-0" />
              อัตราค่ารถ
            </button>

            <button
              onClick={() => handleTabChange('bonus')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'bonus'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-bonus"
            >
              <Award className="h-4 w-4 shrink-0" />
              เงินบวกเพิ่ม
            </button>

            <button
              onClick={() => handleTabChange('penalty')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'penalty'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-penalty"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              ค่าปรับ
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-reports"
            >
              <FileText className="h-4 w-4 shrink-0" />
              สรุปรายงาน
            </button>

            <button
              onClick={() => handleTabChange('users')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 active:bg-slate-50'
              }`}
              id="mobile-tab-users"
            >
              <Users className="h-4 w-4 shrink-0" />
              รายชื่อพนักงาน
            </button>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => scrollMobileNav('right')}
            className="flex items-center justify-center h-8 w-8 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="เลื่อนขวา"
            id="mobile-nav-scroll-right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Views router */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              jobs={jobs}
              rates={rates}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'line-import' && (
            <LineImportView
              rates={rates}
              onImportJobs={handleImportJobs}
              currentUserEmail="it.sumino.apico@gmail.com"
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              jobs={jobs}
              rates={rates}
              onSaveJob={handleSaveJob}
              onDeleteJob={handleDeleteJob}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              currentUserEmail="it.sumino.apico@gmail.com"
            />
          )}

          {activeTab === 'rates' && (
            <RatesView
              rates={rates}
              onSaveRate={handleSaveRate}
              onDeleteRate={handleDeleteRate}
            />
          )}

          {activeTab === 'bonus' && (
            <BonusView
              bonuses={bonuses}
              jobs={jobs}
              onSaveBonus={handleSaveBonus}
              onDeleteBonus={handleDeleteBonus}
            />
          )}

          {activeTab === 'penalty' && (
            <PenaltyView
              penalties={penalties}
              jobs={jobs}
              onSavePenalty={handleSavePenalty}
              onDeletePenalty={handleDeletePenalty}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              jobs={jobs}
              rates={rates}
            />
          )}

          {activeTab === 'users' && (
            <DriversView
              drivers={users}
              onSaveDriver={handleSaveDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isSyncing={isSyncing}
            />
          )}
        </div>
      </main>

      {/* Localized Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <p>© 2026 ระบบคำนวณรายได้คนขับรถสนามบิน • ซิงค์แบบเรียลไทม์กับ Supabase Cloud SQL</p>
      </footer>
    </div>
  );
}
