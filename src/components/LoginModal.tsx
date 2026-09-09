import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  X, 
  ShieldCheck, 
  Shield, 
  UserCheck, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  Building2, 
  Award, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileSignature,
  Users,
  LayoutDashboard,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/wbs';
import { UserCredential, authenticateUser, getStoredAccounts, ROLE_DETAILS } from '../lib/userAccounts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  accounts?: UserCredential[];
  onOpenOfficialPortal?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  accounts,
  onOpenOfficialPortal
}) => {
  const [activeTab, setActiveTab] = useState<'QUICK_ROLE' | 'CREDENTIALS'>('QUICK_ROLE');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const accountList = accounts || getStoredAccounts();

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameInput.trim()) {
      setErrorMessage('Silakan masukkan Username, NIP, atau Email.');
      return;
    }

    const auth = authenticateUser(usernameInput, passwordInput, accountList);
    if (auth) {
      onLoginSuccess(auth);
      onClose();
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setErrorMessage('Kredensial tidak valid. Silakan periksa kembali Username dan Password/PIN.');
    }
  };

  const handleQuickSelect = (credential: UserCredential) => {
    onLoginSuccess(credential.user);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0F172A] text-slate-100 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative my-8"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 shrink-0">
            <KeyRound className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-400/20">
                Portal Pengawas Internal
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400 font-medium">Kabupaten Teluk Wondama</span>
            </div>
            <h3 className="font-black text-xl text-white mt-1">
              Masuk Akun Aparat Pengawas (APIP)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Pilih profil jabatan pengawasan Anda atau masukkan kredensial resmi.
            </p>
          </div>
        </div>

        {/* Actionable Follow Up Banner */}
        {onOpenOfficialPortal && (
          <div className="mt-4 p-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
              <p className="text-xs text-slate-200 leading-snug">
                Perlu menindaklanjuti kasus aktif? Buka <b>Dashboard Tindak Lanjut Pejabat</b>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOfficialPortal();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Buka Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Segmented Selector Mode */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 my-5">
          <button
            type="button"
            onClick={() => setActiveTab('QUICK_ROLE')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'QUICK_ROLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Pilih Akun Cepat (3 Role Pejabat)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'CREDENTIALS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-4 h-4 text-blue-300" />
            <span>Input Username / PIN</span>
          </button>
        </div>

        {/* Tab 1: Quick Role Selection */}
        {activeTab === 'QUICK_ROLE' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-300 font-medium">
              Klik salah satu akun di bawah ini untuk langsung masuk dengan otoritas dan hak akses terkait:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {accountList.map(item => {
                const isInspektur = item.role === 'INSPEKTUR';
                const isIrban = item.role === 'IRBAN_INVESTIGASI';
                const isAdmin = item.role === 'ADMIN';

                return (
                  <div
                    key={item.user.id}
                    onClick={() => handleQuickSelect(item)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer bg-slate-900/80 hover:bg-slate-850 ${
                      isInspektur
                        ? 'border-emerald-500/30 hover:border-emerald-400/80 hover:shadow-lg hover:shadow-emerald-500/10'
                        : isIrban
                        ? 'border-indigo-500/30 hover:border-indigo-400/80 hover:shadow-lg hover:shadow-indigo-500/10'
                        : 'border-blue-500/30 hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-500/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md ${
                          isInspektur ? 'bg-emerald-600' : isIrban ? 'bg-indigo-600' : 'bg-blue-600'
                        }`}>
                          {isInspektur ? <FileSignature className="w-6 h-6" /> : isIrban ? <Users className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              isInspektur 
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                                : isIrban 
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}>
                              {item.user.jabatan}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {item.user.pangkatGolongan}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white mt-1 group-hover:text-blue-300 transition">
                            {item.user.fullName}
                          </h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>NIP: {item.user.nip}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-400">User: {item.username}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white flex items-center gap-1">
                          Masuk
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-400" />
                        </span>
                      </div>
                    </div>

                    {/* Authority Scope summary */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Otoritas:</span>
                      <span className="truncate">
                        {isInspektur && 'Penerbitan & Cetak Surat Perintah Tugas (Sprint), Disposisi Kasus, LHP'}
                        {isIrban && 'Eksekusi Pemeriksaan Lapangan, BAP Saksi, Update Progres Kasus (0-100%)'}
                        {isAdmin && 'Verifikasi Awal Kelayakan, Disposisi Inspektur, Publikasi Progres Pelapor'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Credentials Form */}
        {activeTab === 'CREDENTIALS' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username, NIP, atau Email Dinas:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Contoh: inspektur / irban.investigasi / admin.wbs"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password atau PIN Otorisasi (6 Digit):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan Password atau PIN..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick credentials reference table */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Kredensial Pengujian Resmi:</span>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                <span className="text-emerald-400 font-semibold">1. Inspektur:</span>
                <span className="font-mono text-slate-300">user: <b className="text-white">inspektur</b> | pass: <b className="text-white">inspektur123</b> / pin: <b className="text-white">123456</b></span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                <span className="text-indigo-400 font-semibold">2. Irban Investigasi:</span>
                <span className="font-mono text-slate-300">user: <b className="text-white">irban.investigasi</b> | pass: <b className="text-white">irban123</b> / pin: <b className="text-white">123456</b></span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-blue-400 font-semibold">3. Admin WBS:</span>
                <span className="font-mono text-slate-300">user: <b className="text-white">admin.wbs</b> | pass: <b className="text-white">admin123</b> / pin: <b className="text-white">admin123</b></span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('inspektur');
                  setPasswordInput('inspektur123');
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
              >
                Auto-Fill Inspektur
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('irban.investigasi');
                  setPasswordInput('irban123');
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
              >
                Auto-Fill Irban
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/30"
              >
                Masuk Sistem
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail & Hak Akses Berbasis Peran (RBAC) Aktif</span>
          </div>
          <span className="font-mono text-[10px]">Inspektorat Kab. Teluk Wondama</span>
        </div>
      </motion.div>
    </div>
  );
};
