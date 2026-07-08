import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import {
  DEFAULT_USERS,
  DEFAULT_JOBS,
  DEFAULT_RATES,
  DEFAULT_BONUS,
  DEFAULT_PENALTY
} from './lib/seed';
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
  ShieldCheck
} from 'lucide-react';

const LOCAL_USERS_KEY = 'airport_payroll_users_v2';
const LOCAL_JOBS_KEY = 'airport_payroll_jobs_v2';
const LOCAL_RATES_KEY = 'airport_payroll_rates_v2';
const LOCAL_BONUS_KEY = 'airport_payroll_bonus_v2';
const LOCAL_PENALTY_KEY = 'airport_payroll_penalty_v2';

// Translation functions
const mapJobFromDB = (j: any): Job => ({
  id: j.id,
  date: j.date,
  time: j.time,
  vehicleCode: j.vehicle_code,
  route: j.route,
  airport: j.airport,
  flight: j.flight || '',
  baseFare: Number(j.base_fare),
  bonus: Number(j.bonus),
  penalty: Number(j.penalty),
  tax: Number(j.tax),
  netIncome: Number(j.net_income),
  createdBy: j.created_by,
  createdDate: j.created_date
});

const mapJobToDB = (j: Job) => ({
  id: j.id,
  date: j.date,
  time: j.time,
  vehicle_code: j.vehicleCode,
  route: j.route,
  airport: j.airport,
  flight: j.flight,
  base_fare: j.baseFare,
  bonus: j.bonus,
  penalty: j.penalty,
  tax: j.tax,
  net_income: j.netIncome,
  created_by: j.createdBy,
  created_date: j.createdDate
});

const mapRateFromDB = (r: any): VehicleRate => ({
  vehicleCode: r.vehicle_code,
  description: r.description,
  price: Number(r.price)
});

const mapRateToDB = (r: VehicleRate) => ({
  vehicle_code: r.vehicleCode,
  description: r.description,
  price: r.price
});

const mapBonusFromDB = (b: any): BonusEntry => ({
  id: b.id,
  jobId: b.job_id,
  amount: Number(b.amount),
  remark: b.remark
});

const mapBonusToDB = (b: BonusEntry) => ({
  id: b.id,
  job_id: b.jobId,
  amount: b.amount,
  remark: b.remark
});

const mapPenaltyFromDB = (p: any): PenaltyEntry => ({
  id: p.id,
  jobId: p.job_id,
  amount: Number(p.amount),
  reason: p.reason
});

const mapPenaltyToDB = (p: PenaltyEntry) => ({
  id: p.id,
  job_id: p.jobId,
  amount: p.amount,
  reason: p.reason
});

export default function App() {
  // Navigation (Default to dashboard)
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Sync / Supabase State
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // App Data State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rates, setRates] = useState<VehicleRate[]>([]);
  const [bonuses, setBonuses] = useState<BonusEntry[]>([]);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);

  // 1. Fallback to Local Storage in case of database table errors
  const loadLocalFallback = useCallback(() => {
    const cachedUsers = localStorage.getItem(LOCAL_USERS_KEY);
    const cachedJobs = localStorage.getItem(LOCAL_JOBS_KEY);
    const cachedRates = localStorage.getItem(LOCAL_RATES_KEY);
    const cachedBonus = localStorage.getItem(LOCAL_BONUS_KEY);
    const cachedPenalty = localStorage.getItem(LOCAL_PENALTY_KEY);

    if (cachedUsers && cachedJobs && cachedRates && cachedBonus && cachedPenalty) {
      setUsers(JSON.parse(cachedUsers));
      setJobs(JSON.parse(cachedJobs));
      setRates(JSON.parse(cachedRates));
      setBonuses(JSON.parse(cachedBonus));
      setPenalties(JSON.parse(cachedPenalty));
    } else {
      setUsers(DEFAULT_USERS);
      setJobs(DEFAULT_JOBS);
      setRates(DEFAULT_RATES);
      setBonuses(DEFAULT_BONUS);
      setPenalties(DEFAULT_PENALTY);
    }
  }, []);

  // 2. Fetch all values from Supabase Cloud DB
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

      // Auto-seed if empty
      if (mappedUsers.length === 0 && mappedRates.length === 0 && mappedJobs.length === 0) {
        console.log("Supabase is empty. Automatically seeding default sandbox data...");
        // Call seed function but inline to avoid state race conditions
        const { error: uErr } = await supabase.from('user_accounts').upsert(
          DEFAULT_USERS.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            status: u.status
          }))
        );
        if (uErr) throw uErr;

        const { error: rErr } = await supabase.from('vehicle_rates').upsert(DEFAULT_RATES.map(mapRateToDB));
        if (rErr) throw rErr;

        const { error: jErr } = await supabase.from('jobs').upsert(DEFAULT_JOBS.map(mapJobToDB));
        if (jErr) throw jErr;

        const { error: bErr } = await supabase.from('bonus_entries').upsert(DEFAULT_BONUS.map(mapBonusToDB));
        if (bErr) throw bErr;

        if (DEFAULT_PENALTY.length > 0) {
          const { error: pErr } = await supabase.from('penalty_entries').upsert(DEFAULT_PENALTY.map(mapPenaltyToDB));
          if (pErr) throw pErr;
        }

        // Retry read
        const { data: u2 } = await supabase.from('user_accounts').select('*');
        const { data: r2 } = await supabase.from('vehicle_rates').select('*');
        const { data: j2 } = await supabase.from('jobs').select('*');
        const { data: b2 } = await supabase.from('bonus_entries').select('*');
        const { data: p2 } = await supabase.from('penalty_entries').select('*');

        setUsers((u2 || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status })));
        setRates((r2 || []).map(mapRateFromDB));
        setJobs((j2 || []).map(mapJobFromDB));
        setBonuses((b2 || []).map(mapBonusFromDB));
        setPenalties((p2 || []).map(mapPenaltyFromDB));
      } else {
        setUsers(mappedUsers);
        setRates(mappedRates);
        setJobs(mappedJobs);
        setBonuses(mappedBonuses);
        setPenalties(mappedPenalties);
      }

      setDbError(null);
    } catch (err: any) {
      console.log('Supabase offline fallback active (not an error, using local storage):', err.message || err);
      setDbError(err.message || 'โปรดตรวจสอบความถูกต้องของฐานข้อมูล Supabase (ตารางอาจยังไม่ได้สร้าง)');
      loadLocalFallback();
    } finally {
      setIsSyncing(false);
    }
  }, [loadLocalFallback]);

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

  // Reset sandbox seed data
  const handleResetSeedData = async () => {
    setIsSyncing(true);
    try {
      // 1. Delete all records from Supabase tables
      const { error: bErr } = await supabase.from('bonus_entries').delete().neq('id', 'placeholder');
      if (bErr) throw bErr;
      const { error: pErr } = await supabase.from('penalty_entries').delete().neq('id', 'placeholder');
      if (pErr) throw pErr;
      const { error: jErr } = await supabase.from('jobs').delete().neq('id', 'placeholder');
      if (jErr) throw jErr;
      const { error: rErr } = await supabase.from('vehicle_rates').delete().neq('vehicle_code', 'placeholder');
      if (rErr) throw rErr;
      const { error: uErr } = await supabase.from('user_accounts').delete().neq('id', 'placeholder');
      if (uErr) throw uErr;

      // 2. Insert DEFAULT records to Supabase tables
      const { error: uIns } = await supabase.from('user_accounts').insert(
        DEFAULT_USERS.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          status: u.status
        }))
      );
      if (uIns) throw uIns;

      const { error: rIns } = await supabase.from('vehicle_rates').insert(DEFAULT_RATES.map(mapRateToDB));
      if (rIns) throw rIns;

      const { error: jIns } = await supabase.from('jobs').insert(DEFAULT_JOBS.map(mapJobToDB));
      if (jIns) throw jIns;

      const { error: bIns } = await supabase.from('bonus_entries').insert(DEFAULT_BONUS.map(mapBonusToDB));
      if (bIns) throw bIns;

      if (DEFAULT_PENALTY.length > 0) {
        const { error: pIns } = await supabase.from('penalty_entries').insert(DEFAULT_PENALTY.map(mapPenaltyToDB));
        if (pIns) throw pIns;
      }

      await loadSupabaseData();
      alert('รีเซ็ตล้างฐานข้อมูล Supabase และโหลด 29 เที่ยววิ่งทดสอบใหม่สำเร็จ!');
    } catch (err: any) {
      console.log('Seed reset Supabase fallback notification:', err.message || err);
      alert(`ไม่สามารถรีเซ็ตข้อมูลคลาวด์ได้: ${err.message}\n(ตรวจพบว่ายังไม่มีตารางข้อมูลในคลาวด์ โปรดสร้างตารางข้อมูลในหน้า SQL Editor ของ Supabase ก่อน)`);
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-indigo-900/50 border border-indigo-700/50 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-200 font-medium font-mono">it.sumino.apico@gmail.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Spreadsheet Status Header Card */}
        <SpreadsheetSync
          isSyncing={isSyncing}
          onResetSeedData={handleResetSeedData}
          dbError={dbError}
        />

        {/* 100% Thai Navigation Menu */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-xl shadow-xs border border-slate-100 p-1.5 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
            id="tab-dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            แผงควบคุมหลัก (Dashboard)
          </button>

          <button
            onClick={() => setActiveTab('line-import')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'line-import'
                ? 'bg-emerald-600 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
            id="tab-line-import"
          >
            <Clipboard className="h-4 w-4" />
            นำเข้าจาก LINE (Import)
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'jobs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-jobs"
          >
            <Briefcase className="h-4 w-4" />
            ตารางเที่ยววิ่ง (Jobs) ({jobs.length})
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'rates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-rates"
          >
            <Percent className="h-4 w-4" />
            อัตราค่ารถ (VehicleRates)
          </button>

          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'bonus'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-bonus"
          >
            <Award className="h-4 w-4" />
            เงินบวกเพิ่ม (Bonus)
          </button>

          <button
            onClick={() => setActiveTab('penalty')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'penalty'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-penalty"
          >
            <AlertTriangle className="h-4 w-4" />
            รายการค่าปรับ (Penalty)
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-users"
          >
            <Users className="h-4 w-4" />
            รายชื่อพนักงาน (Users)
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
            id="tab-settings"
          >
            <Settings className="h-4 w-4" />
            โครงสร้างคู่มือระบบ
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
              onResetSeedData={handleResetSeedData}
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
