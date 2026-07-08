import React, { useState, useMemo } from 'react';
import { Job, VehicleRate, getCleanJobId } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  X,
  Sparkles,
  Clipboard,
  Award,
  AlertOctagon,
  PlaneTakeoff,
  LayoutDashboard,
  Table,
  TrendingUp,
  Coins,
  Percent,
  Briefcase,
  TrendingDown,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface JobsViewProps {
  jobs: Job[];
  rates: VehicleRate[];
  onSaveJob: (job: Job) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onNavigateToTab: (tab: any) => void;
  currentUserEmail: string;
}

const DAY_NAMES_THAI = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

const getThaiDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const day = d.getDay();
  return DAY_NAMES_THAI[day] || '';
};

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
};

export default function JobsView({
  jobs,
  rates,
  onSaveJob,
  onDeleteJob,
  onNavigateToTab,
  currentUserEmail
}: JobsViewProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [selectedAirport, setSelectedAirport] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Fields
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicleCode, setVehicleCode] = useState('');
  const [route, setRoute] = useState('');
  const [airport, setAirport] = useState('สุวรรณภูมิ');
  const [flight, setFlight] = useState('');
  const [baseFare, setBaseFare] = useState<number | ''>('');
  const [bonus, setBonus] = useState<number>(0);
  const [penalty, setPenalty] = useState<number>(0);

  // Handle Vehicle Code select changes to auto-populate default rate price
  const handleVehicleCodeChange = (code: string) => {
    setVehicleCode(code);
    const matched = rates.find(r => r.vehicleCode.toLowerCase() === code.toLowerCase());
    if (matched) {
      setBaseFare(matched.price);
    }
  };

  // Live Calculations for the form
  const liveCalculation = useMemo(() => {
    const fare = Number(baseFare) || 0;
    const b = Number(bonus) || 0;
    const p = Number(penalty) || 0;
    const taxableAmount = Math.max(0, fare + b - p);
    const tax = taxableAmount * 0.05;
    const net = taxableAmount - tax;

    return {
      tax,
      net: Math.max(0, net)
    };
  }, [baseFare, bonus, penalty]);

  // Filtering Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        job.id.toLowerCase().includes(search.toLowerCase()) ||
        job.route.toLowerCase().includes(search.toLowerCase()) ||
        (job.flight && job.flight.toLowerCase().includes(search.toLowerCase())) ||
        job.vehicleCode.toLowerCase().includes(search.toLowerCase());

      const matchesAirport = selectedAirport === 'All' || job.airport === selectedAirport;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && job.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && job.date <= endDate;
      }

      return matchesSearch && matchesAirport && matchesDate;
    }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [jobs, search, selectedAirport, startDate, endDate]);

  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('table');

  // Compute metrics based on filtered jobs
  const metrics = useMemo(() => {
    const totalJobsCount = filteredJobs.length;
    const totalBaseFare = filteredJobs.reduce((sum, j) => sum + j.baseFare, 0);
    const totalBonus = filteredJobs.reduce((sum, j) => sum + j.bonus, 0);
    const totalPenalty = filteredJobs.reduce((sum, j) => sum + j.penalty, 0);
    const totalTax = filteredJobs.reduce((sum, j) => sum + j.tax, 0);
    const totalNetIncome = filteredJobs.reduce((sum, j) => sum + j.netIncome, 0);

    return {
      totalJobsCount,
      totalBaseFare,
      totalBonus,
      totalPenalty,
      totalTax,
      totalNetIncome
    };
  }, [filteredJobs]);

  // Group filtered jobs by date
  const groupedJobs = useMemo(() => {
    const groups: Record<string, Job[]> = {};
    filteredJobs.forEach(job => {
      if (!groups[job.date]) {
        groups[job.date] = [];
      }
      groups[job.date].push(job);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Latest date first
    return sortedDates.map(date => {
      const sortedJobs = groups[date].sort((a, b) => a.time.localeCompare(b.time));
      const totals = sortedJobs.reduce(
        (acc, j) => {
          acc.trips += 1;
          acc.base += j.baseFare;
          acc.bonus += j.bonus;
          acc.penalty += j.penalty;
          acc.tax += j.tax;
          acc.net += j.netIncome;
          return acc;
        },
        { trips: 0, base: 0, bonus: 0, penalty: 0, tax: 0, net: 0 }
      );
      return {
        date,
        jobs: sortedJobs,
        dayName: getThaiDayName(date),
        totals
      };
    });
  }, [filteredJobs]);

  // Compute airport distribution for charts
  const airportStats = useMemo(() => {
    const counts: Record<string, { count: number; net: number }> = {};
    filteredJobs.forEach(j => {
      const airportName = j.airport || 'อื่นๆ';
      if (!counts[airportName]) counts[airportName] = { count: 0, net: 0 };
      counts[airportName].count += 1;
      counts[airportName].net += j.netIncome;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      net: Math.round(data.net)
    })).sort((a, b) => b.count - a.count);
  }, [filteredJobs]);

  // Compute vehicle distribution for charts
  const vehicleStats = useMemo(() => {
    const counts: Record<string, { count: number; net: number }> = {};
    filteredJobs.forEach(j => {
      const code = j.vehicleCode || 'ไม่ระบุ';
      if (!counts[code]) counts[code] = { count: 0, net: 0 };
      counts[code].count += 1;
      counts[code].net += j.netIncome;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      net: Math.round(data.net)
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredJobs]);

  // Daily trend of jobs and net income
  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; trips: number; net: number }> = {};
    const sorted = [...filteredJobs].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(j => {
      if (!map[j.date]) {
        map[j.date] = { date: j.date, trips: 0, net: 0 };
      }
      map[j.date].trips += 1;
      map[j.date].net += j.netIncome;
    });
    return Object.values(map).slice(-10); // Show last 10 days of filtered jobs
  }, [filteredJobs]);

  const handleOpenAddForm = () => {
    setEditingJob(null);
    setJobId(`D${Math.floor(1000 + Math.random() * 9000)}-01`);
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().substring(0, 5));
    setVehicleCode(rates[0]?.vehicleCode || '');
    setRoute('');
    setAirport('สุวรรณภูมิ');
    setFlight('');
    setBaseFare(rates[0]?.price || '');
    setBonus(0);
    setPenalty(0);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (job: Job) => {
    setEditingJob(job);
    setJobId(job.id);
    setDate(job.date);
    setTime(job.time);
    setVehicleCode(job.vehicleCode);
    setRoute(job.route);
    setAirport(job.airport);
    setFlight(job.flight || '');
    setBaseFare(job.baseFare);
    setBonus(job.bonus);
    setPenalty(job.penalty);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(`คุณแน่ใจว่าต้องการลบข้อมูลงานวิ่งรหัส ${id} หรือไม่? การลบนี้จะนำข้อมูลออกจากฐานสเปรดชีตทันที`);
    if (confirmed) {
      await onDeleteJob(id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleCode) {
      alert('กรุณาเลือกหรือระบุรหัสรุ่นรถ');
      return;
    }

    // Ensure unique ID for database if it's a new job to prevent clashes on Supabase
    const finalId = editingJob 
      ? jobId 
      : `${jobId}_${date.replace(/-/g, '')}_${time.replace(':', '')}_${Math.floor(100 + Math.random() * 900)}`;

    const finalJob: Job = {
      id: finalId,
      date,
      time,
      vehicleCode,
      route: route.trim() || 'แอร์สุ–กทม',
      airport,
      flight: flight.trim() || undefined,
      baseFare: Number(baseFare) || 0,
      bonus: Number(bonus) || 0,
      penalty: Number(penalty) || 0,
      tax: parseFloat(liveCalculation.tax.toFixed(2)),
      netIncome: parseFloat(liveCalculation.net.toFixed(2)),
      createdBy: currentUserEmail,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    await onSaveJob(finalJob);
    setIsFormOpen(false);
  };

  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${partsPart(parts[1])}/${parts[0]}`;
  };

  function partsPart(monthStr: string) {
    return monthStr;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Quick link button to LINE copy paste converter & add new trip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">บันทึกเที่ยวงานวิ่งรับ-ส่งสนามบิน (Dispatches Directory)</h3>
          <p className="text-xs text-slate-500 mt-0.5">จัดการ ค้นหา เพิ่ม หรือลบ รอบบริการส่งสนามบินสุวรรณภูมิและดอนเมือง</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateToTab('line-import')}
            className="px-4 py-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Clipboard className="h-4 w-4" />
            คัดลอกวางจาก LINE (แปลงข้อมูลดิบ)
          </button>

          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            id="btn-add-job"
          >
            <Plus className="h-4 w-4" />
            เพิ่มงานวิ่งแมนนวล
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารหัสงาน, เส้นทาง, เที่ยวบิน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              id="input-search-jobs"
            />
          </div>

          <div>
            <select
              value={selectedAirport}
              onChange={(e) => setSelectedAirport(e.target.value)}
              className="py-2 px-3.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              id="select-filter-airport"
            >
              <option value="All">ทุกสนามบิน</option>
              <option value="สุวรรณภูมิ">สุวรรณภูมิ</option>
              <option value="ดอนเมือง">ดอนเมือง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-2 px-3.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              placeholder="วันที่เริ่มต้น"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-2 px-3.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              placeholder="วันที่สิ้นสุด"
            />
          </div>
        </div>
      </div>

      {/* View Switcher and Quick Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              id="view-mode-table"
            >
              <Table className="h-4 w-4" />
              ตารางรายการ ({filteredJobs.length} เที่ยว)
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              id="view-mode-dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
              แดชบอร์ดรายงาน (Dynamic Report)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs px-2">
          <div className="text-slate-500">
            ยอดสุทธิรวมที่กรอง: <span className="font-mono font-bold text-indigo-600 text-sm">฿{metrics.totalNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-slate-300">|</div>
          <div className="text-slate-500">
            หักภาษี 5%: <span className="font-mono font-semibold text-rose-600">฿{metrics.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        /* Booking list grouped by day */
        <div className="space-y-8">
          {groupedJobs.length > 0 ? (
            groupedJobs.map(group => (
              <div key={group.date} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id={`day-table-${group.date}`}>
                {/* Day Header - Blue Header bar */}
                <div className="bg-[#244270]/10 p-4 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-indigo-600" />
                    {group.dayName} ที่ {formatDateDMY(group.date)}
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
                    {group.totals.trips} เที่ยววิ่ง
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#244270] text-white font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                        <th className="py-3.5 px-5">รหัสงาน</th>
                        <th className="py-3.5 px-4">เวลา</th>
                        <th className="py-3.5 px-4">รหัสรถ</th>
                        <th className="py-3.5 px-4">เส้นทางวิ่ง & เที่ยวบิน</th>
                        <th className="py-3.5 px-4">สนามบิน</th>
                        <th className="py-3.5 px-4 text-right">ค่างานดิบ</th>
                        <th className="py-3.5 px-4 text-right text-emerald-100">เงินเพิ่ม (โบนัส)</th>
                        <th className="py-3.5 px-4 text-right text-rose-100">ค่าปรับ</th>
                        <th className="py-3.5 px-4 text-right text-rose-100">ภาษีหัก 5%</th>
                        <th className="py-3.5 px-4 text-right text-indigo-100">ยอดรับสุทธิ</th>
                        <th className="py-3.5 px-5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.jobs.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-5 font-bold text-slate-800 font-mono">{getCleanJobId(job.id)}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-center gap-1 font-mono">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{job.time} น.</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{job.vehicleCode}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]">{job.route}</p>
                            {job.flight && (
                              <p className="text-[9.5px] text-indigo-600 font-mono flex items-center gap-0.5 mt-0.5">
                                ✈️ {job.flight}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-600">{job.airport}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                            ฿{job.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {job.bonus > 0 ? `฿${job.bonus.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-500">
                            {job.penalty > 0 ? `฿${job.penalty.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            ฿{job.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 bg-indigo-50/10">
                            ฿{job.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditForm(job)}
                                className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                title="แก้ไขงานวิ่ง"
                                id={`btn-edit-${job.id}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(job.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="ลบงานวิ่ง"
                                id={`btn-delete-${job.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {/* Sum Row matching Daily Sheet style */}
                      <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200 border-b-4 border-double border-slate-950 text-slate-800">
                        <td colSpan={5} className="py-3.5 px-5 text-left font-black text-slate-900">
                          รวม {group.dayName}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                          ฿{group.totals.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                          ฿{group.totals.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-500">
                          ฿{group.totals.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600">
                          ฿{group.totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700 bg-indigo-100/10">
                          ฿{group.totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
              ไม่พบบันทึกเที่ยววิ่งรถสนามบินตามเงื่อนไขการค้นหาข้างต้น
            </div>
          )}
        </div>
      ) : (
        /* Dynamic dashboard reports view */
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">จำนวนงานขับที่เลือก</p>
                <h3 className="text-xl font-black text-slate-800 mt-1">{metrics.totalJobsCount.toLocaleString()} เที่ยว</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">จากเงื่อนไขตัวกรองปัจจุบัน</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">ค่างานดิบ (Base Fare)</p>
                <h3 className="text-xl font-black text-slate-800 mt-1">฿{metrics.totalBaseFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 font-mono">โบนัสสะสม: ฿{metrics.totalBonus.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins className="h-5 w-5" />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">ภาษีหัก ณ ที่จ่าย 5%</p>
                <h3 className="text-xl font-black text-rose-600 mt-1">฿{metrics.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-rose-500 font-bold mt-0.5 font-mono">ค่าปรับสะสม: ฿{metrics.totalPenalty.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Percent className="h-5 w-5" />
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider font-sans">รายรับรวมสุทธิ (Net)</p>
                <h3 className="text-xl font-black text-indigo-600 mt-1">฿{metrics.totalNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-indigo-400 mt-0.5">ยอดหลังหักภาษี 5% และหักค่าปรับแล้ว</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Net Trend Area Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  แนวโน้มรายได้และรอบวิ่งรายวัน (สูงสุด 10 วันล่าสุด)
                </h4>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">อัปเดตเรียลไทม์</span>
              </div>
              <div className="h-64 w-full">
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNetFiltered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']} contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" name="ยอดรับสุทธิ (Net)" dataKey="net" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorNetFiltered)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs font-sans">
                    ไม่พบบันทึกการทำงานในช่วงที่เลือก เพื่อมาจัดทำสถิติ
                  </div>
                )}
              </div>
            </div>

            {/* Airport Distribution Pie Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <PlaneTakeoff className="h-4 w-4 text-emerald-600" />
                  สัดส่วนพิกัดสนามบิน (เที่ยววิ่ง)
                </h4>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                {airportStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={airportStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {airportStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#06b6d4' : '#10b981'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} เที่ยว`, '']} contentStyle={{ fontSize: '11px' }} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 text-xs flex items-center justify-center h-full font-sans">ไม่มีข้อมูลช่วงเวลานี้</div>
                )}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans">สรุปสนามบินหลัก</p>
                <div className="space-y-1">
                  {airportStats.map((stat, i) => (
                    <div key={stat.name} className="flex justify-between text-[11px] text-slate-600 font-sans">
                      <span>{i+1}. {stat.name}</span>
                      <span className="font-mono font-bold text-slate-800">{stat.count} เที่ยว (฿{stat.net.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Top Vehicles & Average insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Vehicles */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Sparkles className="h-4 w-4 text-amber-500" />
                รหัสรุ่นรถที่ใช้บ่อยสูงสุด 5 อันดับแรก (เที่ยวงานช่วงนี้)
              </h4>
              <div className="space-y-3.5">
                {vehicleStats.length > 0 ? (
                  vehicleStats.map((v, idx) => {
                    const maxCount = Math.max(...vehicleStats.map(item => item.count)) || 1;
                    const percent = Math.round((v.count / maxCount) * 100);
                    return (
                      <div key={v.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{idx + 1}</span>
                            <span className="font-bold text-slate-700 font-mono">{v.name}</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {v.count} เที่ยวงาน • <span className="font-bold text-slate-700">฿{v.net.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-400 text-xs py-8 text-center font-sans">ไม่มีข้อมูลรุ่นรถ</div>
                )}
              </div>
            </div>

            {/* Smart Summary / Insights Cards */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <FileText className="h-4 w-4 text-indigo-500" />
                บทวิเคราะห์ความคุ้มค่าและเฉลี่ยต่อรอบ (Financial Insights)
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">รายรับเฉลี่ยสุทธิ / รอบ</span>
                  <p className="text-base font-extrabold text-indigo-600 font-mono">
                    ฿{metrics.totalJobsCount > 0 ? (metrics.totalNetIncome / metrics.totalJobsCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-normal font-sans">ยอดรับเงินสดเฉลี่ยหลังจากประมวลผลหักลบรายจ่ายแล้ว</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">ภาษีเฉลี่ยหัก ณ ที่จ่าย / รอบ</span>
                  <p className="text-base font-extrabold text-rose-600 font-mono">
                    ฿{metrics.totalJobsCount > 0 ? (metrics.totalTax / metrics.totalJobsCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-normal font-sans">ภาระภาษีเฉลี่ย 5% ต่อเที่ยวงานวิ่ง</p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 flex items-start gap-2.5 text-xs text-indigo-950 font-sans">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">ข้อมูลสถิติที่มีคุณประโยชน์</p>
                  <p className="text-[10.5px] text-indigo-700 leading-relaxed font-sans">
                    จากการวิเคราะห์ข้อมูล {metrics.totalJobsCount} เที่ยววิ่ง ล่าสุด พิกัด <span className="font-semibold text-indigo-900">{(airportStats[0]?.name) || 'ทั่วไป'}</span> เป็นพิกัดปลายทางที่ทำเงินสะสมสูงสุด และรหัสรถที่ให้บริการสูงที่สุดคือ <span className="font-semibold text-indigo-900">{(vehicleStats[0]?.name) || '-'}</span> แนะนำให้จัดสรรรถตามสถิตินี้เพื่อรักษาอัตราผลตอบแทนสูงสุด
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  {editingJob ? 'แก้ไขข้อมูลรอบงานวิ่งรับ-ส่ง' : 'บันทึกเที่ยวงานสนามบินแมนนวล'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  รหัสงาน: {getCleanJobId(jobId)} {editingJob && jobId !== getCleanJobId(jobId) && `(รหัสอ้างอิงระบบ: ${jobId})`}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                id="btn-close-job-form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">วันที่ปฏิบัติงาน (Date)</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    id="form-job-date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">เวลาเรียกรถ (Time)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    id="form-job-time"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">รหัสรถ / รุ่นรถ (Vehicle Code)</label>
                  <select
                    required
                    value={vehicleCode}
                    onChange={(e) => handleVehicleCodeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    id="form-job-driver"
                  >
                    <option value="" disabled>เลือกรหัสรถ...</option>
                    {rates.map(r => (
                      <option key={r.vehicleCode} value={r.vehicleCode}>{r.vehicleCode} (฿{r.price.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">เที่ยวบิน (Flight - ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="เช่น TG312"
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    id="form-job-passenger"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">เส้นทางเดินรถ (Route)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สุขุมวิท–แอร์สุ"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    id="form-job-pickup"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">สนามบินพิกัดปลายทาง</label>
                  <select
                    required
                    value={airport}
                    onChange={(e) => setAirport(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    id="form-job-dropoff"
                  >
                    <option value="สุวรรณภูมิ">สุวรรณภูมิ</option>
                    <option value="ดอนเมือง">ดอนเมือง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">คำนวณรายจ่ายและหักภาษี 5% อัตโนมัติ</h5>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ค่างานต่องาน (บาท)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={baseFare}
                      onChange={(e) => setBaseFare(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                      id="form-job-base-fare"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">บวกเพิ่ม (Bonus - บาท)</label>
                    <input
                      type="number"
                      min="0"
                      value={bonus}
                      onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      id="form-job-tolls"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ค่าปรับพนักงาน (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      value={penalty}
                      onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      id="form-job-tips"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <div>
                    <p>หักภาษี ณ ที่จ่าย: <span className="text-rose-600 font-bold">5%</span></p>
                    <p className="text-[9px] text-slate-400 mt-0.5">สูตร: (ค่างาน + โบนัส - ค่าปรับ) × 5%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">ภาษีหัก ณ ที่จ่าย 5%</p>
                    <p className="text-xs font-bold text-rose-600 font-mono">฿{liveCalculation.tax.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-indigo-500 font-bold uppercase">ยอดเงินคนขับรับสุทธิ</p>
                    <p className="text-sm font-extrabold text-indigo-700 font-mono">฿{liveCalculation.net.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  id="btn-save-job"
                >
                  บันทึกงานวิ่ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
