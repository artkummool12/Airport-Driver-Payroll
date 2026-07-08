import React, { useState, useMemo } from 'react';
import { UserAccount } from '../types';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  X,
  ShieldAlert
} from 'lucide-react';

interface DriversViewProps {
  drivers: UserAccount[]; // This maps to our Users collection
  onSaveDriver: (user: UserAccount) => Promise<void>;
  onDeleteDriver: (email: string) => Promise<void>;
}

export default function DriversView({ drivers, onSaveDriver, onDeleteDriver }: DriversViewProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Driver'>('Driver');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const filteredUsers = useMemo(() => {
    return drivers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.toLowerCase().includes(search.toLowerCase())
    );
  }, [drivers, search]);

  const metrics = useMemo(() => {
    const total = drivers.length;
    const admins = drivers.filter(u => u.role === 'Admin').length;
    const activeDrivers = drivers.filter(u => u.role === 'Driver' && u.status === 'Active').length;

    return {
      total,
      admins,
      activeDrivers,
      inactive: total - admins - activeDrivers
    };
  }, [drivers]);

  const handleOpenAddForm = () => {
    setEditingUser(null);
    setEmail('');
    setRole('Driver');
    setName('');
    setPhone('');
    setStatus('Active');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: UserAccount) => {
    setEditingUser(user);
    setEmail(user.email);
    setRole(user.role);
    setName(user.name);
    setPhone(user.phone);
    setStatus(user.status);
    setIsFormOpen(true);
  };

  const handleDelete = async (userEmail: string, userName: string) => {
    const confirmed = window.confirm(`คุณต้องการลบข้อมูลบัญชีของ ${userName} (${userEmail}) ออกจากระบบหรือไม่?`);
    if (confirmed) {
      await onDeleteDriver(userEmail);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    const updated: UserAccount = {
      ...user,
      status: user.status === 'Active' ? 'Inactive' : 'Active'
    };
    await onSaveDriver(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      alert('กรุณากรอกอีเมลและชื่อผู้ใช้ให้ครบถ้วน');
      return;
    }

    const finalUser: UserAccount = {
      id: editingUser ? editingUser.id : '',
      email: email.trim().toLowerCase(),
      role,
      name: name.trim(),
      phone: phone.trim() || '-',
      status
    };

    await onSaveDriver(finalUser);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">บัญชีผู้ใช้ทั้งหมด</span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-800">{metrics.total}</h3>
            <span className="text-xs text-slate-400">บัญชีในระบบ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คนขับรถที่พร้อมรับงาน</span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-black text-emerald-600">{metrics.activeDrivers}</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">สแตนด์บาย</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้ดูแลระบบ (Admin)</span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-black text-indigo-600">{metrics.admins}</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">แอดมิน</span>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อพนักงาน, อีเมล, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            id="input-search-drivers"
          />
        </div>

        <button
          onClick={handleOpenAddForm}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
          id="btn-add-driver"
        >
          <UserPlus className="h-4 w-4" />
          เพิ่มผู้ใช้ / คนขับใหม่
        </button>
      </div>

      {/* Grid of users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.email} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-200 transition-all">
              <div className="p-5 border-b border-slate-50 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center uppercase ${user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {user.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {user.name}
                      <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {user.role === 'Admin' ? 'แอดมิน' : 'คนขับ'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono font-medium">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(user)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-colors ${
                    user.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                  id={`btn-toggle-status-${user.email}`}
                >
                  {user.status === 'Active' ? 'พร้อมวิ่งงาน' : 'หยุดปฏิบัติงาน'}
                </button>
              </div>

              <div className="p-5 space-y-2.5 text-xs text-slate-600 flex-grow font-sans">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate text-slate-700">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-700 font-mono">{user.phone}</span>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100/70 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">สิทธิ์เข้าใช้งานระบบ</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditForm(user)}
                    className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-lg transition-colors"
                    title="แก้ไขผู้ใช้งาน"
                    id={`btn-edit-drv-${user.email}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.email, user.name)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                    title="ลบผู้ใช้งาน"
                    id={`btn-delete-drv-${user.email}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">ไม่พบบัญชีผู้ใช้งานหรือคนขับตรงตามคำค้นหา</p>
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  {editingUser ? 'แก้ไขโปรไฟล์ผู้ใช้งาน' : 'ลงทะเบียนผู้ใช้ / คนขับใหม่'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  เชื่อมโยงกับบัญชี Google ในขั้นตอนการยืนยันตัวตน
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                id="btn-close-driver-form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">อีเมลแอดเดรส (Google Email)</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="เช่น driver.airport@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 font-mono"
                  id="form-driver-email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อ-นามสกุล (Full Name)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="form-driver-name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">เบอร์โทรศัพท์ (Phone Number)</label>
                <input
                  type="text"
                  placeholder="เช่น 089-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  id="form-driver-phone"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">บทบาทสิทธิ์ (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    id="form-driver-role"
                  >
                    <option value="Driver">คนขับรถ (Driver)</option>
                    <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">สถานะผู้ใช้งาน (Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    id="form-driver-status"
                  >
                    <option value="Active">พร้อมปฏิบัติงาน (Active)</option>
                    <option value="Inactive">หยุดปฏิบัติงานชั่วคราว (Inactive)</option>
                  </select>
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
                  id="btn-save-driver"
                >
                  บันทึกโปรไฟล์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
