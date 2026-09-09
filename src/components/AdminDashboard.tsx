import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Send,
  Sparkles,
  UserCheck,
  Lock,
  Activity,
  FileSpreadsheet,
  Smartphone,
  Mail,
  X,
  Download,
  TrendingUp,
  Shield,
  Layers,
  ArrowUpRight,
  Zap,
  Check,
  Users,
  Building,
  Bell,
  FileSignature,
  FileCheck2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Share2,
  KeyRound,
  BarChart3,
  PieChart as LucidePieChart
} from 'lucide-react';
import { Report, ReportStatus, SeverityLevel, InvestigationStage, UserAccount } from '../types/wbs';
import { decryptData } from '../lib/crypto';
import { UserCredential, getStoredAccounts } from '../lib/userAccounts';
import { UserManagementView } from './UserManagementView';
import { PrintBeritaAcara } from './PrintBeritaAcara';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminDashboardProps {
  reports: Report[];
  onUpdateStatus: (
    ticketCode: string,
    newStatus: ReportStatus,
    noteTitle: string,
    noteDesc: string,
    investigator?: string,
    notifyUser?: boolean
  ) => void;
  onVerifyAndForwardToInspektur?: (
    ticketCode: string,
    isFeasible: boolean,
    reason: string,
    priorityScore: number
  ) => void;
  onPublishIrbanProgressToReporter?: (
    ticketCode: string,
    stageTitle: string,
    progressPercent: number,
    publicNote: string
  ) => void;
  onSimulateNewReport: () => void;
  isSimulatingLive: boolean;
  setIsSimulatingLive: (val: boolean) => void;
  currentUser?: UserAccount | null;
  accounts?: UserCredential[];
  onAddAccount?: (newAcc: UserCredential) => void;
  onUpdateAccount?: (updatedAcc: UserCredential) => void;
  onDeleteAccount?: (accountId: string) => void;
  onQuickLoginAs?: (user: UserAccount) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onUpdateStatus,
  onVerifyAndForwardToInspektur,
  onPublishIrbanProgressToReporter,
  onSimulateNewReport,
  isSimulatingLive,
  setIsSimulatingLive,
  currentUser,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onQuickLoginAs
}) => {
  // Sub-tabs inside dashboard
  const [dashboardSubTab, setDashboardSubTab] = useState<'OVERVIEW' | 'CASES' | 'DISPOSISI' | 'MONITORING_IRBAN' | 'TELEMETRY' | 'USER_MANAGEMENT'>('OVERVIEW');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [printReport, setPrintReport] = useState<Report | null>(null);

  // Status Modal Edit State
  const [editStatus, setEditStatus] = useState<ReportStatus>('INVESTIGASI');
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDesc, setStatusDesc] = useState('');
  const [investigatorName, setInvestigatorName] = useState('');
  const [notifyPelaporMobile, setNotifyPelaporMobile] = useState(true);

  // Verification to Inspektur Modal State
  const [verifyReport, setVerifyReport] = useState<Report | null>(null);
  const [verifyFeasible, setVerifyFeasible] = useState(true);
  const [verifyReason, setVerifyReason] = useState('');
  const [verifyPriority, setVerifyPriority] = useState(90);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Publish Irban Progress to Reporter Modal State
  const [publishProgressReport, setPublishProgressReport] = useState<Report | null>(null);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishNote, setPublishNote] = useState('');

  // Copy/Export Feedback State
  const [copiedExport, setCopiedExport] = useState(false);

  // Filter Reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reporterEmail && r.reporterEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.location && r.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'ALL' || r.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
  });

  // Calculate Key Metrics
  const totalReports = reports.length;
  const countBaru = reports.filter(r => r.status === 'BARU').length;
  const countVerifikasi = reports.filter(r => r.status === 'TERVERIFIKASI').length;
  const countInvestigasi = reports.filter(r => r.status === 'INVESTIGASI').length;
  const countTindakLanjut = reports.filter(r => r.status === 'TINDAK_LANJUT').length;
  const countSelesai = reports.filter(r => r.status === 'SELESAI').length;
  const countDitolak = reports.filter(r => r.status === 'DITOLAK').length;

  const countPendingInspektur = reports.filter(r => r.adminVerification?.forwardedToInspektur && !r.suratPerintah).length;
  const countIrbanActive = reports.filter(r => !!r.suratPerintah || r.status === 'INVESTIGASI' || r.status === 'TINDAK_LANJUT' || (r.investigationStages && r.investigationStages.length > 0)).length;
  const countActiveSprint = reports.filter(r => !!r.suratPerintah).length;

  const totalKerugian = reports.reduce((acc, r) => acc + (r.estimatedLossRupiah || 0), 0);
  const anonymousCount = reports.filter(r => r.anonymity === 'ANONYMOUS').length;
  const anonymousRatio = totalReports > 0 ? Math.round((anonymousCount / totalReports) * 100) : 0;
  const resolutionRate = totalReports > 0 ? Math.round((countSelesai / totalReports) * 100) : 0;

  // Chart Data Preparation
  const categoryChartData = [
    { name: 'Korupsi/Pungli', count: reports.filter(r => r.category === 'KORUPSI_GRATIFIKASI').length },
    { name: 'Fraud Keuangan', count: reports.filter(r => r.category === 'FRAUD_KEUANGAN').length },
    { name: 'PBJ / Lelang', count: reports.filter(r => r.category === 'PENGADAAN_BARANG_JASA').length },
    { name: 'Wewenang ASN', count: reports.filter(r => r.category === 'PENYALAHGUNAAN_WEWENANG').length },
    { name: 'Pelecehan/SARA', count: reports.filter(r => r.category === 'PELECEHAN_SARA').length },
    { name: 'Kode Etik', count: reports.filter(r => r.category === 'PELANGGARAN_KODE_ETIK').length }
  ];

  const statusPieData = [
    { name: 'Baru', value: countBaru, color: '#0EA5E9' },
    { name: 'Verifikasi', value: countVerifikasi, color: '#3B82F6' },
    { name: 'Investigasi', value: countInvestigasi, color: '#8B5CF6' },
    { name: 'Tindak Lanjut', value: countTindakLanjut, color: '#F59E0B' },
    { name: 'Selesai', value: countSelesai, color: '#10B981' },
    { name: 'Ditolak', value: countDitolak, color: '#EF4444' }
  ];

  const handleOpenEdit = (report: Report) => {
    setSelectedReport(report);
    setEditStatus(report.status);
    setStatusTitle(`Tindak Lanjut Pemeriksaan Tiket ${report.ticketCode}`);
    setStatusDesc(`Pemeriksaan lapangan dan audit dokumen oleh Tim Investigasi Inspektorat Kabupaten Teluk Wondama.`);
    setInvestigatorName(report.assignedInvestigator || 'Tim Inspektur Pembantu Khusus Wondama');
  };

  const handleOpenVerifyModal = (report: Report) => {
    setVerifyReport(report);
    setVerifyFeasible(true);
    setVerifyReason(`Bukti awal dan dokumen pendukung telah diteliti oleh Admin WBS. Memenuhi kriteria kelayakan untuk diterbitkan Surat Perintah Tugas Investigasi oleh Inspektur.`);
    setVerifyPriority(report.aiAnalysis?.urgencyScore || 85);
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyReport) return;

    if (onVerifyAndForwardToInspektur) {
      onVerifyAndForwardToInspektur(
        verifyReport.ticketCode,
        verifyFeasible,
        verifyReason,
        verifyPriority
      );
    } else {
      onUpdateStatus(
        verifyReport.ticketCode,
        verifyFeasible ? 'TERVERIFIKASI' : 'DITOLAK',
        verifyFeasible ? 'Verifikasi Kelayakan Admin WBS' : 'Pengaduan Tidak Memenuhi Syarat',
        verifyReason,
        'Admin Verifikator WBS',
        true
      );
    }

    setFeedbackNotice(`Laporan ${verifyReport.ticketCode} berhasil diverifikasi & didisposisikan ke portal Inspektur secara real-time!`);
    setVerifyReport(null);
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handleOpenPublishModal = (report: Report) => {
    setPublishProgressReport(report);
    const activeStage = report.investigationStages?.find(s => s.status === 'SEDANG_BERJALAN') || 
                        report.investigationStages?.find(s => s.status === 'SELESAI');
    setPublishTitle(activeStage ? `Progres: ${activeStage.title}` : `Pembaruan Tahapan Investigasi Kasus`);
    setPublishNote(report.irbanNotes || activeStage?.notes || 'Tim Irban Investigasi sedang melaksanakan klarifikasi pihak terkait di lapangan.');
  };

  const handleSavePublishToReporter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishProgressReport) return;

    const percent = publishProgressReport.investigationProgressPercent || 50;

    if (onPublishIrbanProgressToReporter) {
      onPublishIrbanProgressToReporter(
        publishProgressReport.ticketCode,
        publishTitle,
        percent,
        publishNote
      );
    } else {
      onUpdateStatus(
        publishProgressReport.ticketCode,
        'INVESTIGASI',
        publishTitle,
        publishNote,
        publishProgressReport.assignedInvestigator || 'Tim Irban Investigasi',
        true
      );
    }

    setFeedbackNotice(`Pembaruan progres investigasi tiket ${publishProgressReport.ticketCode} telah dipublikasikan ke dashboard Pelapor!`);
    setPublishProgressReport(null);
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    onUpdateStatus(
      selectedReport.ticketCode,
      editStatus,
      statusTitle || `Perubahan Status ${editStatus}`,
      statusDesc || "Catatan perkembangan penanganan kasus disimpan.",
      investigatorName,
      notifyPelaporMobile
    );

    setSelectedReport(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Kode Tiket", "Subjek", "Kategori", "Lokasi", "Status", "Urgensi", "Email Pelapor", "Estimasi Kerugian (Rp)", "Tanggal Masuk"];
    const rows = reports.map(r => [
      r.ticketCode,
      `"${r.subject.replace(/"/g, '""')}"`,
      r.category,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      r.status,
      r.severity,
      r.reporterEmail || "Anonim",
      r.estimatedLossRupiah || 0,
      new Date(r.createdAt).toLocaleDateString('id-ID')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_WBS_Inspektorat_Wondama_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      {/* Stitch Bento Header Card */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Panel Komando Admin WBS
              </span>
              <span className="bg-slate-800 text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Live In-App Workflow (No-Email)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard Pengawasan WBS Inspektorat Wondama
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verifikasi kelayakan pengaduan, disposisi ke Inspektur, pantau 6 tahapan investigasi Irban, dan laporkan kemajuan kasus langsung ke dashboard pelapor.
            </p>
          </div>

          {/* Action Buttons & Streaming Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setIsSimulatingLive(!isSimulatingLive)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isSimulatingLive
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400 animate-pulse'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              {isSimulatingLive ? 'Live Stream: Aktif' : 'Streaming Real-Time'}
            </button>

            <button
              type="button"
              onClick={onSimulateNewReport}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition"
            >
              <RefreshCw className="w-4 h-4" />
              Simulasi Laporan Masuk
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow flex items-center gap-2 cursor-pointer transition"
            >
              {copiedExport ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              {copiedExport ? 'Data Diunduh!' : 'Ekspor CSV'}
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDashboardSubTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'OVERVIEW'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Ringkasan & Metrik Analitik
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('CASES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'CASES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Rekam Kasus ({reports.length})
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('DISPOSISI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'DISPOSISI'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            Disposisi ke Inspektur ({countPendingInspektur})
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('MONITORING_IRBAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'MONITORING_IRBAN'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Monitoring Irban & Publikasi Pelapor ({countIrbanActive})
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('TELEMETRY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'TELEMETRY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Audit Log & Telemetri
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('USER_MANAGEMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'USER_MANAGEMENT'
                ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-300'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Kelola User & Password Pejabat ({(accounts || getStoredAccounts()).length})
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </motion.div>
      )}

      {/* SUBTAB 1: OVERVIEW & ANALYTICS */}
      {dashboardSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Metric Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Pengaduan</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {totalReports}
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalReports} Kasus</div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span className="text-emerald-600 font-bold">+{countBaru}</span> kasus baru terdaftar
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Disposisi Inspektur</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  {countPendingInspektur}
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">{countPendingInspektur} Menunggu</div>
              <p className="text-[11px] text-slate-500 font-medium">
                Siap diterbitkan Surat Perintah (Sprint)
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Investigasi Irban</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  {countActiveSprint}
                </div>
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono">{countActiveSprint} Sprint Aktif</div>
              <p className="text-[11px] text-slate-500 font-medium">
                Tim pemeriksa di lapangan
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Potensi Kerugian</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  Rp
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 font-mono truncate">
                Rp {totalKerugian > 0 ? (totalKerugian / 1000000000).toFixed(2) + ' Miliar' : '0'}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Taksiran akumulasi pengaduan
              </p>
            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Distribusi Kategori Pengaduan OPD</h3>
                  <p className="text-xs text-slate-500">Klasifikasi dugaan pelanggaran masuk di Kabupaten Teluk Wondama</p>
                </div>
              </div>

              {totalReports === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium">Belum ada data pengaduan untuk ditampilkan pada grafik statistik.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Status Penanganan Kasus</h3>
                <p className="text-xs text-slate-500">Komposisi siklus kasus WBS</p>
              </div>

              {totalReports === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                  <LucidePieChart className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium text-center px-4">Menunggu laporan pengaduan masuk.</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REKAM KASUS TABLE */}
      {dashboardSubTab === 'CASES' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Filter & Search */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Daftar Rekam Kasus WBS Teluk Wondama</h2>
              <p className="text-xs text-slate-500">
                Verifikasi kelayakan kasus untuk Inspektur, pantau progres Irban, atau perbarui status penanganan secara manual.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari Tiket / Subjek / OPD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="KORUPSI_GRATIFIKASI">Korupsi / Suap</option>
                <option value="FRAUD_KEUANGAN">Fraud Keuangan</option>
                <option value="PENGADAAN_BARANG_JASA">Pengadaan Barang/Jasa</option>
                <option value="PENYALAHGUNAAN_WEWENANG">Wewenang</option>
                <option value="PELECEHAN_SARA">Pelecehan / SARA</option>
                <option value="PELANGGARAN_KODE_ETIK">Kode Etik</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="BARU">BARU</option>
                <option value="TERVERIFIKASI">TERVERIFIKASI</option>
                <option value="INVESTIGASI">INVESTIGASI</option>
                <option value="TINDAK_LANJUT">TINDAK_LANJUT</option>
                <option value="SELESAI">SELESAI</option>
                <option value="DITOLAK">DITOLAK</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-white font-black">
                <tr>
                  <th className="p-3.5">Kode Tiket</th>
                  <th className="p-3.5">Subjek & Uraian Dugaan</th>
                  <th className="p-3.5">Status Alur WBS</th>
                  <th className="p-3.5">Status Sprint / Irban</th>
                  <th className="p-3.5">Urgensi</th>
                  <th className="p-3.5 text-right">Aksi Penanganan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      {reports.length === 0
                        ? "Belum ada laporan pengaduan yang terdaftar dalam sistem WBS."
                        : "Tidak ada berkas laporan yang sesuai kriteria pencarian."}
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isVerified = report.adminVerification?.forwardedToInspektur || report.status === 'TERVERIFIKASI';
                    const hasSprint = !!report.suratPerintah;
                    return (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-black text-blue-600 whitespace-nowrap">
                          {report.ticketCode}
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">{report.subject}</p>
                          <p className="text-[10px] text-slate-500 truncate">{report.category} • {report.location || 'Kab. Teluk Wondama'}</p>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                              report.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : report.status === 'INVESTIGASI'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : report.status === 'TINDAK_LANJUT'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : report.status === 'TERVERIFIKASI'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}>
                              {report.status}
                            </span>
                            {report.lastProgressUpdateAt && (
                              <p className="text-[9px] text-purple-600 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                Sync Irban Aktif
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {report.investigationProgressPercent !== undefined || (report.investigationStages && report.investigationStages.length > 0) || hasSprint ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <FileSignature className="w-3 h-3" />
                                  Irban: {report.investigationProgressPercent || (hasSprint ? 50 : 0)}%
                                </span>
                              </div>
                              {report.investigationStages && report.investigationStages.length > 0 && (
                                <p className="text-[10px] text-slate-600 font-medium max-w-[150px] truncate" title={report.investigationStages.find(s => s.status === 'SEDANG_BERJALAN')?.title || 'Tahap Investigasi'}>
                                  {report.investigationStages.find(s => s.status === 'SEDANG_BERJALAN') 
                                    ? `▶ ${report.investigationStages.find(s => s.status === 'SEDANG_BERJALAN')!.title.split('&')[0].trim()}`
                                    : report.investigationProgressPercent === 100 
                                    ? '✓ 6 Tahap Tuntas' 
                                    : 'Menunggu Tim'}
                                </p>
                              )}
                            </div>
                          ) : isVerified ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" />
                              Disposisi Inspektur
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Belum Diverifikasi
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            report.severity === 'KRITIS' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            report.severity === 'TINGGI' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-blue-50 text-blue-900 border border-blue-200'
                          }`}>
                            {report.severity}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => handleOpenVerifyModal(report)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verifikasi & Disposisi
                            </button>
                          )}

                          {hasSprint && (
                            <button
                              type="button"
                              onClick={() => handleOpenPublishModal(report)}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Publikasi ke Pelapor
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setPrintReport(report)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer border border-blue-200 transition"
                            title="Cetak Berita Acara Tanda Terima Laporan Resmi"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-700" />
                            <span>Tanda Terima</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(report)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DISPOSISI KE INSPEKTUR */}
      {dashboardSubTab === 'DISPOSISI' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Status Disposisi Pengaduan ke Inspektur Daerah
            </h2>
            <p className="text-xs text-slate-500">
              Pengaduan yang telah diverifikasi kelayakannya oleh admin dan diteruskan ke pimpinan untuk penerbitan Surat Perintah Tugas (Sprint).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reports.filter(r => r.adminVerification?.forwardedToInspektur || r.status === 'TERVERIFIKASI').length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Belum ada laporan yang diverifikasi & didisposisikan ke Inspektur.</p>
              </div>
            ) : (
              reports.filter(r => r.adminVerification?.forwardedToInspektur || r.status === 'TERVERIFIKASI').map((rep) => (
                <div
                  key={rep.id}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        {rep.ticketCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.suratPerintah ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.suratPerintah ? 'Surat Perintah Diterbitkan' : 'Menunggu Tindakan Inspektur'}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{rep.subject}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Rekomendasi Admin: "{rep.adminVerification?.reason || 'Terverifikasi Layak'}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rep.suratPerintah ? (
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-xl">
                        Sprint: {rep.suratPerintah.nomorSprint}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Dalam Antrean Pimpinan
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: MONITORING IRBAN & PUBLIKASI PELAPOR */}
      {dashboardSubTab === 'MONITORING_IRBAN' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Monitoring Perkembangan Irban Investigasi & Publikasi Pelapor
            </h2>
            <p className="text-xs text-slate-500">
              Menerima secara real-time progres 6 tahapan investigasi dari tim Irban Khusus, dan meneruskannya ke dashboard pelapor agar pelapor memantau status secara transparan.
            </p>
          </div>

          <div className="space-y-6">
            {reports.filter(r => !!r.suratPerintah || r.status === 'INVESTIGASI' || r.status === 'TINDAK_LANJUT' || (r.investigationStages && r.investigationStages.length > 0)).length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileSignature className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Belum ada kasus yang dalam tahap investigasi Irban aktif.</p>
              </div>
            ) : (
              reports.filter(r => !!r.suratPerintah || r.status === 'INVESTIGASI' || r.status === 'TINDAK_LANJUT' || (r.investigationStages && r.investigationStages.length > 0)).map((report) => {
                const activeStageObj = report.investigationStages?.find(s => s.status === 'SEDANG_BERJALAN') || 
                  (report.investigationStages?.every(s => s.status === 'SELESAI') ? report.investigationStages[report.investigationStages.length - 1] : report.investigationStages?.[0]);

                return (
                <div
                  key={report.id}
                  className="border border-purple-200 rounded-3xl p-6 bg-slate-50 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                          {report.ticketCode}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          report.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' :
                          report.status === 'INVESTIGASI' ? 'bg-purple-100 text-purple-800' :
                          report.status === 'TINDAK_LANJUT' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          Status: {report.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          Sprint: {report.suratPerintah?.nomorSprint || 'Penugasan Khusus'}
                        </span>
                        {report.lastProgressUpdateAt && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Update Irban: {new Date(report.lastProgressUpdateAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-1">{report.subject}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200">
                        Progres Irban: {report.investigationProgressPercent || (report.status === 'SELESAI' ? 100 : 50)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenPublishModal(report)}
                        className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Publikasikan ke Pelapor
                      </button>
                    </div>
                  </div>

                  {/* Active Stage Callout */}
                  {activeStageObj && (
                    <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-black">📍 Posisi Alur Terkini:</span>
                        <span className="font-bold text-slate-900">
                          Tahap {activeStageObj.stageNumber} — {activeStageObj.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        activeStageObj.status === 'SELESAI' ? 'bg-emerald-200 text-emerald-900' :
                        activeStageObj.status === 'SEDANG_BERJALAN' ? 'bg-purple-200 text-purple-900 animate-pulse' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {activeStageObj.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Stage Snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                    {report.investigationStages?.map((stg) => (
                      <div
                        key={stg.id}
                        className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                          stg.status === 'SELESAI'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : stg.status === 'SEDANG_BERJALAN'
                            ? 'bg-purple-50 border-purple-400 text-purple-950 font-black shadow-sm ring-1 ring-purple-300'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span>T-{stg.stageNumber}</span>
                          <span>{stg.status === 'SELESAI' ? '✓' : stg.status === 'SEDANG_BERJALAN' ? '▶' : '○'}</span>
                        </div>
                        <p className="truncate font-semibold">{stg.title.split('&')[0]}</p>
                      </div>
                    ))}
                  </div>

                  {report.irbanNotes && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Catatan Hasil Pemeriksaan Lapangan oleh Irban: </span>
                      <span className="text-slate-600 italic">"{report.irbanNotes}"</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* SUBTAB 5: TELEMETRY */}
      {dashboardSubTab === 'TELEMETRY' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Audit Log Kriptografi & Telemetri WBS</h2>
            <p className="text-xs text-slate-500">Integritas enkripsi AES-256-GCM dan jejak audit digital Pemerintah Kabupaten Teluk Wondama.</p>
          </div>

          <div className="bg-slate-950 text-slate-200 font-mono text-xs p-5 rounded-2xl space-y-2 border border-slate-800">
            <div className="text-emerald-400 font-bold">● SYSTEM_STATUS: ALL SERVICES HEALTHY (AES-256 SECURED)</div>
            <div className="text-slate-400">-------------------------------------------------------------</div>
            <div>[2026-08-28T09:00:00Z] INSP_DISPATCH: In-App notification delivered to Inspektur Portal (Ticket: WBS-2026-9204-B8)</div>
            <div>[2026-08-28T09:15:00Z] SPRINT_SIGN: Digital signature verified hash: sha256-sig-99012a89302198031201923019230129</div>
            <div>[2026-08-28T09:20:00Z] IRBAN_SYNC: Irban Investigasi updated Stage 3 (BAP Klarifikasi) • Progress: 50%</div>
            <div>[2026-08-28T09:25:00Z] REPORTER_PUB: Published milestone update to reporter dashboard timeline.</div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: USER MANAGEMENT */}
      {dashboardSubTab === 'USER_MANAGEMENT' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900">Manajemen Akun, Username & Password Pejabat Pengawas</h2>
                <p className="text-xs text-slate-500">Kelola kredensial resmi Inspektur Daerah, Irban Investigasi, dan Admin WBS dengan sinkronisasi instan.</p>
              </div>
            </div>

            <UserManagementView
              accounts={accounts || getStoredAccounts()}
              onAddAccount={onAddAccount || (() => {})}
              onUpdateAccount={onUpdateAccount || (() => {})}
              onDeleteAccount={onDeleteAccount || (() => {})}
              onQuickLoginAs={onQuickLoginAs}
            />
          </div>
        </div>
      )}

      {/* MODAL: VERIFIKASI KELAYAKAN ADMIN KE INSPEKTUR */}
      <AnimatePresence>
        {verifyReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-slate-200"
            >
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Verifikasi Kelayakan Pengaduan</h3>
                    <p className="text-xs text-slate-500 font-mono">Ref: {verifyReport.ticketCode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyReport(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveVerification} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-2">
                    Keputusan Kelayakan untuk Ditindaklanjuti:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVerifyFeasible(true)}
                      className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                        verifyFeasible
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      LAYAK INVESTIGASI
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerifyFeasible(false)}
                      className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                        !verifyFeasible
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      TIDAK MEMENUHI SYARAT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan & Analisis Pertimbangan Admin untuk Inspektur:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                    placeholder="Tuliskan telaah bukti awal dan alasan kelayakan..."
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVerifyReport(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Kirim Disposisi ke Portal Inspektur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PUBLIKASI KEMAJUAN INVESTIGASI KE PELAPOR */}
      <AnimatePresence>
        {publishProgressReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-slate-200"
            >
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Publikasi Progres ke Dashboard Pelapor</h3>
                    <p className="text-xs text-slate-500 font-mono">Ref Tiket: {publishProgressReport.ticketCode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishProgressReport(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePublishToReporter} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Status Perkembangan:
                  </label>
                  <input
                    type="text"
                    required
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:border-purple-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Resmi yang Akan Muncul di Dashboard Pelapor:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                    placeholder="Informasi perkembangan yang dapat dilihat pelapor..."
                  />
                </div>

                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-[11px] text-purple-900">
                  <span className="font-bold">Info:</span> Catatan ini akan langsung diperbarui pada timeline pelacak kasus pelapor ketika pelapor memasukkan kode tiket & PIN rahasia.
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPublishProgressReport(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Publikasikan ke Pelapor Sekarang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MANUAL EDIT STATUS */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 border border-slate-200"
            >
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Perbarui Status Penanganan Berkas</h3>
                  <p className="text-xs text-slate-500 font-mono">Kode Tiket: {selectedReport.ticketCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Penanganan Baru:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ReportStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BARU">BARU</option>
                    <option value="TERVERIFIKASI">TERVERIFIKASI</option>
                    <option value="INVESTIGASI">INVESTIGASI</option>
                    <option value="TINDAK_LANJUT">TINDAK LANJUT</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Tim / Auditor Penanggung Jawab:</label>
                  <input
                    type="text"
                    value={investigatorName}
                    onChange={(e) => setInvestigatorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Catatan Timeline:</label>
                  <input
                    type="text"
                    required
                    value={statusTitle}
                    onChange={(e) => setStatusTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uraian Perkembangan Pemeriksaan:</label>
                  <textarea
                    rows={3}
                    required
                    value={statusDesc}
                    onChange={(e) => setStatusDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
