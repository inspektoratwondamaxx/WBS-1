import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
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
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  FolderCheck,
  Printer,
  ChevronDown,
  Check,
  Send,
  HelpCircle
} from 'lucide-react';
import { Report, ReportStatus, SeverityLevel, UserAccount, UserRole } from '../types/wbs';
import { UserCredential, authenticateUser, ROLE_DETAILS, getStoredAccounts } from '../lib/userAccounts';
import { decryptData } from '../lib/crypto';
import { PrintBeritaAcara } from './PrintBeritaAcara';

interface OfficialFollowUpPortalProps {
  reports: Report[];
  accounts: UserCredential[];
  currentUser: UserAccount | null;
  onLoginUser: (user: UserAccount) => void;
  onNavigateTab: (tabId: string) => void;
  onSelectSpecificReport?: (ticketCode: string) => void;
}

export const OfficialFollowUpPortal: React.FC<OfficialFollowUpPortalProps> = ({
  reports,
  accounts,
  currentUser,
  onLoginUser,
  onNavigateTab,
  onSelectSpecificReport
}) => {
  // Login Form States
  const [selectedRole, setSelectedRole] = useState<UserRole>('INSPEKTUR');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetTicketCode, setTargetTicketCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginMode, setLoginMode] = useState<'QUICK_CARD' | 'MANUAL_FORM'>('QUICK_CARD');

  // Filter state for actionable reports table
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'VERIFIED' | 'INVESTIGATION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [printReport, setPrintReport] = useState<Report | null>(null);

  // Statistics
  const newReportsCount = reports.filter(r => r.status === 'BARU').length;
  const verifiedWaitingSprintCount = reports.filter(r => r.status === 'TERVERIFIKASI' && !r.suratPerintah).length;
  const activeInvestigationCount = reports.filter(r => r.status === 'INVESTIGASI' || !!r.suratPerintah).length;
  const completedCount = reports.filter(r => r.status === 'SELESAI').length;
  const criticalCount = reports.filter(r => r.severity === 'TINGGI' || r.severity === 'KRITIS').length;

  const totalFollowUpPending = newReportsCount + verifiedWaitingSprintCount + activeInvestigationCount;

  // Find sample credentials for fast login
  const inspekturAcc = accounts.find(a => a.role === 'INSPEKTUR') || accounts[0];
  const irbanAcc = accounts.find(a => a.role === 'IRBAN_INVESTIGASI') || accounts[1];
  const adminAcc = accounts.find(a => a.role === 'ADMIN') || accounts[2];

  const handleQuickLoginAs = (credential: UserCredential, redirectTab?: string) => {
    onLoginUser(credential.user);
    if (redirectTab) {
      onNavigateTab(redirectTab);
    } else if (credential.role === 'INSPEKTUR') {
      onNavigateTab('INSPEKTUR_VIEW');
    } else if (credential.role === 'IRBAN_INVESTIGASI') {
      onNavigateTab('IRBAN_INVESTIGASI_VIEW');
    } else {
      onNavigateTab('ADMIN_DASHBOARD');
    }
  };

  const handleManualLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameInput.trim()) {
      setErrorMessage('Silakan masukkan Username, NIP, atau Email dinas Anda.');
      return;
    }

    const auth = authenticateUser(usernameInput, passwordInput, accounts);
    if (auth) {
      onLoginUser(auth);
      if (targetTicketCode && onSelectSpecificReport) {
        onSelectSpecificReport(targetTicketCode);
      }
      if (auth.role === 'INSPEKTUR') {
        onNavigateTab('INSPEKTUR_VIEW');
      } else if (auth.role === 'IRBAN_INVESTIGASI') {
        onNavigateTab('IRBAN_INVESTIGASI_VIEW');
      } else {
        onNavigateTab('ADMIN_DASHBOARD');
      }
    } else {
      setErrorMessage('Username atau Password/PIN salah. Pastikan kredensial yang dimasukkan sesuai.');
    }
  };

  // Filter actionable reports
  const actionableReports = reports.filter(r => {
    const matchesSearch = 
      r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'NEW') return r.status === 'BARU';
    if (statusFilter === 'VERIFIED') return r.status === 'TERVERIFIKASI';
    if (statusFilter === 'INVESTIGATION') return r.status === 'INVESTIGASI' || !!r.suratPerintah;

    return true;
  });

  const getStatusBadge = (status: ReportStatus, hasSprint: boolean) => {
    if (status === 'BARU') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400" />
          Menunggu Verifikasi Kelayakan
        </span>
      );
    }
    if (status === 'TERVERIFIKASI' && !hasSprint) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <FileSignature className="w-3 h-3 text-emerald-400" />
          Menunggu Disposisi Sprint Inspektur
        </span>
      );
    }
    if (status === 'INVESTIGASI' || hasSprint) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <Users className="w-3 h-3 text-indigo-400" />
          Sedang Ditindaklanjuti Irban (BAP)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-700">
        <CheckCircle2 className="w-3 h-3 text-slate-400" />
        Selesai LHP
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              PORTAL MASUK RESMI PEJABAT & KOMANDO TINDAK LANJUT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              APIP INSPEKTORAT KABUPATEN TELUK WONDAMA
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
            Portal Masuk Pejabat Pengawas
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mt-2 leading-relaxed">
            Portal otentikasi terpadu bagi <b>Inspektur Daerah</b>, <b>Inspektur Pembantu (Irban) Investigasi</b>, dan <b>Administrator WBS</b> untuk menindaklanjuti pengaduan masyarakat secara terintegrasi, transparan, dan akuntabel sesuai peraturan perundang-undangan.
          </p>

          {/* Current Logged In Banner if active */}
          {currentUser && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black ${
                  currentUser.role === 'INSPEKTUR' ? 'bg-emerald-600' : currentUser.role === 'IRBAN_INVESTIGASI' ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {currentUser.role === 'INSPEKTUR' ? <FileSignature className="w-6 h-6" /> : currentUser.role === 'IRBAN_INVESTIGASI' ? <Users className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{currentUser.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      {currentUser.jabatan}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Anda saat ini sedang login. Klik tombol di kanan untuk langsung membuka ruang kerja tindak lanjut Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser.role === 'INSPEKTUR') onNavigateTab('INSPEKTUR_VIEW');
                    else if (currentUser.role === 'IRBAN_INVESTIGASI') onNavigateTab('IRBAN_INVESTIGASI_VIEW');
                    else onNavigateTab('ADMIN_DASHBOARD');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Ruang Kerja Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Follow-up Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Butuh Tindak Lanjut</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-amber-400">{totalFollowUpPending}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Semua Berkas Antrean Aktif</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/30 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">1. Verifikasi Admin</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-white">{newReportsCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Aduan Baru Belum Telaah</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">2. Disposisi Inspektur</span>
            <FileSignature className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-emerald-400">{verifiedWaitingSprintCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Siap Diterbitkan Sprint Tugas</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">3. Investigasi Irban</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-indigo-400">{activeInvestigationCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Pemeriksaan BAP & Saksi</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-blue-500/30 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300">Prioritas Kritis</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-blue-400">{criticalCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Dugaan Dampak Signifikan</span>
        </div>
      </div>

      {/* SECTION: 3 Jalur Masuk Berdasarkan Wewenang Tindak Lanjut */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              Pilih Ruang Kerja Pejabat untuk Menindaklanjuti
            </h2>
            <p className="text-xs text-slate-400">
              Pilih wewenang jabatan Anda untuk langsung masuk dan memproses penanganan berkas kasus WBS.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setLoginMode('QUICK_CARD')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                loginMode === 'QUICK_CARD' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Masuk Cepat Pejabat
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('MANUAL_FORM')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                loginMode === 'MANUAL_FORM' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Input Kredensial / PIN
            </button>
          </div>
        </div>

        {/* Tab Mode 1: 3 Executive Action Cards */}
        {loginMode === 'QUICK_CARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Inspektur Daerah */}
            <div className="bg-[#0D1527] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                    <FileSignature className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Otoritas Pimpinan
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">Inspektur Daerah</h3>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  {inspekturAcc?.user.fullName || 'Drs. Jacobus Somambui, M.Si'}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  NIP. {inspekturAcc?.user.nip || '19720415 199803 1 005'}
                </p>

                <div className="my-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tugas & Kewenangan Tindak Lanjut:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • Menerima disposisi aduan dari Admin WBS<br />
                    • Menetapkan & menandatangani <b>Surat Perintah Tugas (Sprint)</b><br />
                    • Tanda Tangan Elektronik (TTE) & penugasan Tim Irban<br />
                    • Menyetujui Laporan Hasil Pemeriksaan (LHP)
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 bg-emerald-950/40 rounded-xl border border-emerald-900/50 mb-4">
                  <span className="text-slate-300 font-medium">Antrean Menunggu Sprint:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {verifiedWaitingSprintCount} Berkas
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickLoginAs(inspekturAcc, 'INSPEKTUR_VIEW')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <FileSignature className="w-4 h-4" />
                <span>Masuk & Tindak Lanjuti Sprint</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>

            {/* Card 2: Irban Investigasi */}
            <div className="bg-[#0D1527] border-2 border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    Pelaksana Audit
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">Irban Investigasi & Khusus</h3>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  {irbanAcc?.user.fullName || 'Hendrik Mansawan, S.E., M.Ak, CGCAE'}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  NIP. {irbanAcc?.user.nip || '19800812 200501 1 008'}
                </p>

                <div className="my-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tugas & Kewenangan Tindak Lanjut:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • Menerima Surat Perintah Tugas resmi dari Inspektur<br />
                    • Pemeriksaan lapangan & pemanggilan saksi (BAP)<br />
                    • Perhitungan indikasi kerugian keuangan negara<br />
                    • Menyusun Draft LHP & rekomendasi sanksi
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 bg-indigo-950/40 rounded-xl border border-indigo-900/50 mb-4">
                  <span className="text-slate-300 font-medium">Kasus Aktif Diperiksa:</span>
                  <span className="font-black text-indigo-400 text-sm">
                    {activeInvestigationCount} Kasus
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickLoginAs(irbanAcc, 'IRBAN_INVESTIGASI_VIEW')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Masuk & Tindak Lanjuti Pemeriksaan</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>

            {/* Card 3: Admin WBS */}
            <div className="bg-[#0D1527] border-2 border-blue-500/40 hover:border-blue-400 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                    <LayoutDashboard className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Verifikator Sistem
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">Admin & Verifikator WBS</h3>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  {adminAcc?.user.fullName || 'Johanes Rumbarar, S.STP'}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  NIP. {adminAcc?.user.nip || '19880512 201101 1 003'}
                </p>

                <div className="my-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tugas & Kewenangan Tindak Lanjut:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • Verifikasi kelengkapan syarat pengaduan 5W+1H<br />
                    • Disposisi berkas yang layak kepada Inspektur<br />
                    • Publikasi pembaruan tahapan kepada pelapor publik<br />
                    • Pengawasan audit trail & kelola akun pejabat
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 bg-blue-950/40 rounded-xl border border-blue-900/50 mb-4">
                  <span className="text-slate-300 font-medium">Aduan Baru Masuk:</span>
                  <span className="font-black text-blue-400 text-sm">
                    {newReportsCount} Aduan
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickLoginAs(adminAcc, 'ADMIN_DASHBOARD')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Masuk & Verifikasi Aduan</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Mode 2: Manual Credentials Form */}
        {loginMode === 'MANUAL_FORM' && (
          <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Login Kredensial Resmi Aparat Pengawas</h3>
                <p className="text-xs text-slate-400">Masukkan Username/NIP dan Password atau PIN Otorisasi 6 digit Anda.</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username, NIP, atau Email Kedinasan:*
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Contoh: inspektur, irban.investigasi, atau admin.wbs"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password Login atau PIN Otorisasi 6-Digit:*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password atau PIN (default: 123456)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional: Target Case Ticket Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Opsi: Pilih Langsung Nomor Kasus yang Ingin Ditindaklanjuti (Opsional)
                </label>
                <select
                  value={targetTicketCode}
                  onChange={(e) => setTargetTicketCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="">-- Masuk ke Dashboard Umum --</option>
                  {reports.map(r => (
                    <option key={r.id} value={r.ticketCode}>
                      {r.ticketCode} - [{r.status}] {r.subject.slice(0, 45)}...
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jika dipilih, sistem akan langsung membuka berkas perkara nomor tiket ini setelah login berhasil.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-blue-200" />
                  <span>Otentikasi & Buka Portal Tindak Lanjut</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* SECTION: Antrean Berkas Pengaduan Siap Ditindaklanjuti */}
      <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <FolderCheck className="w-5 h-5 text-indigo-400" />
              Antrean Berkas Pengaduan Siap Ditindaklanjuti
            </h2>
            <p className="text-xs text-slate-400">
              Daftar pengaduan yang membutuhkan tindakan verifikasi, penerbitan Surat Perintah Tugas (Sprint), atau pemeriksaan investigasi lapangan.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tiket, lokasi, subjek..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status ({reports.length})</option>
              <option value="NEW">1. Aduan Baru ({newReportsCount})</option>
              <option value="VERIFIED">2. Menunggu Sprint ({verifiedWaitingSprintCount})</option>
              <option value="INVESTIGATION">3. Dalam Investigasi ({activeInvestigationCount})</option>
            </select>
          </div>
        </div>

        {/* Table / Cards */}
        <div className="space-y-3">
          {actionableReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">Tidak ada pengaduan dalam antrean ini</p>
              <p className="text-xs text-slate-500">Semua laporan telah diproses atau sesuaikan filter pencarian.</p>
            </div>
          ) : (
            actionableReports.map(report => {
              const hasSprint = !!report.suratPerintah;
              const isWaitingSprint = report.status === 'TERVERIFIKASI' && !hasSprint;
              const isInvestigating = report.status === 'INVESTIGASI' || hasSprint;
              const isNew = report.status === 'BARU';

              return (
                <div
                  key={report.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all bg-slate-900/80 hover:bg-slate-900 ${
                    isWaitingSprint 
                      ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-sm' 
                      : isInvestigating 
                      ? 'border-indigo-500/40 hover:border-indigo-400/80 shadow-sm' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-lg">
                          {report.ticketCode}
                        </span>
                        {getStatusBadge(report.status, hasSprint)}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          report.severity === 'TINGGI' || report.severity === 'KRITIS'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Prioritas: {report.severity}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {report.incidentDate || '2026'} • {report.location}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {report.subject}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        Kategori: <b className="text-slate-300">{report.category.replace(/_/g, ' ')}</b>
                        {report.estimatedLossRupiah ? ` • Estimasi Nilai: Rp ${report.estimatedLossRupiah.toLocaleString('id-ID')}` : ''}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setPrintReport(report)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        title="Cetak Berita Acara Tanda Terima Resmi Laporan"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tanda Terima</span>
                      </button>

                      {isWaitingSprint && (
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickLoginAs(inspekturAcc, 'INSPEKTUR_VIEW');
                            if (onSelectSpecificReport) onSelectSpecificReport(report.ticketCode);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Terbitkan Sprint (Inspektur)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isInvestigating && (
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickLoginAs(irbanAcc, 'IRBAN_INVESTIGASI_VIEW');
                            if (onSelectSpecificReport) onSelectSpecificReport(report.ticketCode);
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Tindak Lanjut BAP (Irban)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isNew && (
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickLoginAs(adminAcc, 'ADMIN_DASHBOARD');
                            if (onSelectSpecificReport) onSelectSpecificReport(report.ticketCode);
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Verifikasi Kelayakan (Admin)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION: Standar Operasional Prosedur (SOP) Alur Tindak Lanjut APIP */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white">
        <h3 className="text-base font-black flex items-center gap-2 mb-1">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Alur Standar Tindak Lanjut Pengaduan WBS Inspektorat Wondama
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Pedoman siklus penanganan kasus whistleblowing oleh Aparat Pengawasan Intern Pemerintah (APIP).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] font-mono text-slate-500">Maks. 1-2 Hari</span>
            </div>
            <h4 className="font-bold text-xs text-white">Verifikasi Kelayakan</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Admin WBS menelaah kelengkapan syarat formil & materiil 5W+1H dan bukti pendukung sebelum diteruskan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center">
                2
              </span>
              <span className="text-[10px] font-mono text-slate-500">Maks. 2 Hari</span>
            </div>
            <h4 className="font-bold text-xs text-white">Disposisi & Sprint</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inspektur Daerah menerbitkan Surat Perintah Tugas resmi kepada Tim Irban Investigasi dengan TTE digital.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center">
                3
              </span>
              <span className="text-[10px] font-mono text-slate-500">14 - 30 Hari</span>
            </div>
            <h4 className="font-bold text-xs text-white">Investigasi & BAP</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tim Irban memeriksa lokasi, saksi, dokumen pembukuan, menyusun Berita Acara Pemeriksaan (BAP).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center">
                4
              </span>
              <span className="text-[10px] font-mono text-slate-500">Finalisasi</span>
            </div>
            <h4 className="font-bold text-xs text-white">LHP & Rekomendasi</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Penyusunan Laporan Hasil Pemeriksaan (LHP), rekomendasi sanksi, pengembalian kas negara, atau pelimpahan APH.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL CETAK BERITA ACARA RESMI */}
      {printReport && (
        <PrintBeritaAcara
          report={printReport}
          onClose={() => setPrintReport(null)}
        />
      )}
    </div>
  );
};
