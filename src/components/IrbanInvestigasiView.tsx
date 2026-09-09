import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  Printer, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Layers, 
  Edit3, 
  FileCheck2, 
  MessageSquare, 
  MapPin, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight,
  Upload,
  AlertCircle,
  FileSignature,
  Eye,
  Check,
  Play,
  TrendingUp,
  Activity,
  CheckCheck,
  ChevronRight,
  RotateCcw,
  Building
} from 'lucide-react';
import { Report, InvestigationStage, SuratPerintah, ReportStatus, UserAccount } from '../types/wbs';
import { decryptData } from '../lib/crypto';
import { PrintSuratPerintah } from './PrintSuratPerintah';
import { PrintBeritaAcara } from './PrintBeritaAcara';
import { createDefaultInvestigationStages } from '../lib/investigationWorkflow';

interface IrbanInvestigasiViewProps {
  reports: Report[];
  onUpdateStageProgress: (
    ticketCode: string,
    updatedStages: InvestigationStage[],
    irbanNotes: string,
    notifyAdmin?: boolean,
    explicitStatus?: ReportStatus
  ) => void;
  currentUser?: UserAccount | null;
}

export const IrbanInvestigasiView: React.FC<IrbanInvestigasiViewProps> = ({
  reports,
  onUpdateStageProgress,
  currentUser
}) => {
  // Show reports with active Surat Perintah, status INVESTIGASI, TINDAK_LANJUT, or forwarded by Admin
  const assignedReports = reports.filter(r => 
    !!r.suratPerintah || 
    r.status === 'INVESTIGASI' || 
    r.status === 'TINDAK_LANJUT' || 
    r.adminVerification?.forwardedToInspektur ||
    (r.investigationStages && r.investigationStages.length > 0)
  );

  const [selectedTicketCode, setSelectedTicketCode] = useState<string>(() => {
    return assignedReports.length > 0 ? assignedReports[0].ticketCode : '';
  });

  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'NEED_START' | 'DONE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintBaModal, setShowPrintBaModal] = useState(false);
  const [activeSprintToPrint, setActiveSprintToPrint] = useState<SuratPerintah | null>(null);
  const [successToast, setSuccessToast] = useState('');
  
  // Selected Active Report
  const currentReport = assignedReports.find(r => r.ticketCode === selectedTicketCode) || assignedReports[0];

  // Local state for editing stages of current report
  const [localStages, setLocalStages] = useState<InvestigationStage[]>(() => {
    if (currentReport?.investigationStages && currentReport.investigationStages.length > 0) {
      return currentReport.investigationStages;
    }
    return createDefaultInvestigationStages();
  });

  const [activeStageNoteInput, setActiveStageNoteInput] = useState('');
  const [generalIrbanNotes, setGeneralIrbanNotes] = useState(currentReport?.irbanNotes || '');
  const [selectedStageForEdit, setSelectedStageForEdit] = useState<InvestigationStage | null>(null);

  // When selected report changes, update local state
  const handleSelectReport = (rep: Report) => {
    setSelectedTicketCode(rep.ticketCode);
    const stages = rep.investigationStages && rep.investigationStages.length > 0
      ? rep.investigationStages
      : createDefaultInvestigationStages();
    setLocalStages(stages);
    setGeneralIrbanNotes(rep.irbanNotes || '');
    setSelectedStageForEdit(null);
  };

  // Helper to determine if current report's investigation has officially started
  const isStarted = currentReport ? (
    currentReport.status === 'INVESTIGASI' || 
    currentReport.status === 'TINDAK_LANJUT' || 
    currentReport.status === 'SELESAI' || 
    localStages.some(s => s.status === 'SEDANG_BERJALAN' || s.status === 'SELESAI')
  ) : false;

  // Active stage (currently in progress)
  const activeStageIndex = localStages.findIndex(s => s.status === 'SEDANG_BERJALAN');
  const activeStage = activeStageIndex !== -1 ? localStages[activeStageIndex] : (
    localStages.every(s => s.status === 'SELESAI') ? localStages[localStages.length - 1] : localStages[0]
  );

  const completedCount = localStages.filter(s => s.status === 'SELESAI').length;
  const progressPercent = Math.round((completedCount / localStages.length) * 100);

  // ACTION: Mulai Jalankan Investigasi Kasus
  const handleStartInvestigation = (rep: Report) => {
    const baseStages = (rep.investigationStages && rep.investigationStages.length > 0)
      ? rep.investigationStages
      : createDefaultInvestigationStages();

    const now = new Date().toISOString();
    // Activate stage 1 (RKAI) or stage 2
    const updatedStages = baseStages.map((stg, idx) => {
      if (idx === 0) {
        return {
          ...stg,
          status: 'SEDANG_BERJALAN' as const,
          notes: stg.notes || 'Tim Irban memulai telaah dokumen awal & penyusunan Rencana Kerja Audit Investigatif (RKAI).',
          actorName: currentUser ? currentUser.fullName : 'Tim Irban Khusus Investigasi',
          publishedToReporter: true,
          publishedAt: now
        };
      }
      return stg;
    });

    const startNote = 'Kasus resmi mulai dijalankan oleh Tim Irban Khusus Investigasi Inspektorat Wondama. Prosedur audit lapangan diaktifkan.';
    
    setLocalStages(updatedStages);
    setGeneralIrbanNotes(startNote);

    // Langsung simpan dan update ke Admin WBS!
    onUpdateStageProgress(
      rep.ticketCode,
      updatedStages,
      startNote,
      true,
      'INVESTIGASI'
    );

    setSuccessToast(`Kasus ${rep.ticketCode} resmi mulai dijalankan! Progres investigasi otomatis aktif pada Tahap 1 (RKAI) dan langsung terbaca oleh Admin WBS.`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  // ACTION: Selesaikan Tahap Ini & Lanjut ke Tahap Berikutnya Secara Otomatis
  const handleAdvanceToNextStage = () => {
    if (!currentReport) return;

    let targetIdx = activeStageIndex;
    if (targetIdx === -1) {
      // Find first stage not yet finished
      targetIdx = localStages.findIndex(s => s.status === 'BELUM_MULAI');
      if (targetIdx === -1) targetIdx = 0;
    }

    const now = new Date().toISOString();
    const updated = localStages.map((stg, idx) => {
      if (idx === targetIdx) {
        return {
          ...stg,
          status: 'SELESAI' as const,
          completedAt: now,
          publishedToReporter: true,
          publishedAt: now
        };
      } else if (idx === targetIdx + 1) {
        return {
          ...stg,
          status: 'SEDANG_BERJALAN' as const,
          notes: stg.notes || `Mulai melaksanakan kegiatan ${stg.title}.`,
          actorName: currentUser ? currentUser.fullName : 'Tim Irban Investigasi',
          publishedToReporter: true,
          publishedAt: now
        };
      }
      return stg;
    });

    const newCompleted = updated.filter(s => s.status === 'SELESAI').length;
    const newProgressPercent = Math.round((newCompleted / updated.length) * 100);

    let nextStatus: ReportStatus = currentReport.status;
    if (newProgressPercent === 100) {
      nextStatus = 'SELESAI';
    } else if (newProgressPercent >= 60) {
      nextStatus = 'TINDAK_LANJUT';
    } else {
      nextStatus = 'INVESTIGASI';
    }

    const nextStageTitle = targetIdx + 1 < updated.length ? updated[targetIdx + 1].title : 'Finalisasi';
    const note = `Tahap ${targetIdx + 1} (${localStages[targetIdx].title.split('&')[0].trim()}) selesai. Progres dilanjutkan ke: ${nextStageTitle}.`;

    setLocalStages(updated);

    // Langsung simpan dan terbaca di Admin WBS!
    onUpdateStageProgress(
      currentReport.ticketCode,
      updated,
      note,
      true,
      nextStatus
    );

    setSuccessToast(`Tahap ${targetIdx + 1} selesai! Progres berlanjut ke Tahap ${targetIdx + 2} (${newProgressPercent}%) dan langsung tersinkron ke Admin WBS.`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  // Direct Click to advance stage status
  const handleToggleStageStatus = (stageId: string) => {
    if (!currentReport) return;

    const updated = localStages.map(stg => {
      if (stg.id === stageId) {
        let nextStatus: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI' = 'SEDANG_BERJALAN';
        if (stg.status === 'BELUM_MULAI') nextStatus = 'SEDANG_BERJALAN';
        else if (stg.status === 'SEDANG_BERJALAN') nextStatus = 'SELESAI';
        else if (stg.status === 'SELESAI') nextStatus = 'BELUM_MULAI';

        return {
          ...stg,
          status: nextStatus,
          completedAt: nextStatus === 'SELESAI' ? new Date().toISOString() : undefined,
          publishedToReporter: nextStatus === 'SELESAI' || nextStatus === 'SEDANG_BERJALAN'
        };
      }
      return stg;
    });

    setLocalStages(updated);

    const newCompleted = updated.filter(s => s.status === 'SELESAI').length;
    const newProgressPercent = Math.round((newCompleted / updated.length) * 100);

    let nextStatus: ReportStatus = currentReport.status;
    if (newProgressPercent === 100) {
      nextStatus = 'SELESAI';
    } else if (newProgressPercent >= 60) {
      nextStatus = 'TINDAK_LANJUT';
    } else {
      nextStatus = 'INVESTIGASI';
    }

    // Auto-sync langsung ke Admin WBS
    onUpdateStageProgress(
      currentReport.ticketCode,
      updated,
      generalIrbanNotes,
      true,
      nextStatus
    );

    setSuccessToast(`Tahapan investigasi diperbarui dan langsung terbaca oleh Admin WBS.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // ACTION: Ganti Status Penanganan Kasus Langsung oleh Irban
  const handleChangeStatusDirectly = (targetStatus: ReportStatus) => {
    if (!currentReport) return;

    const note = `Status penanganan kasus diubah menjadi ${targetStatus} oleh Irban Khusus Investigasi.`;

    onUpdateStageProgress(
      currentReport.ticketCode,
      localStages,
      note,
      true,
      targetStatus
    );

    setSuccessToast(`Status kasus ${currentReport.ticketCode} langsung diubah menjadi "${targetStatus}" dan terbaca di Admin WBS.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Save specific note for a stage
  const handleSaveStageNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageForEdit || !currentReport) return;

    const updated = localStages.map(stg => {
      if (stg.id === selectedStageForEdit.id) {
        return {
          ...stg,
          notes: activeStageNoteInput,
          actorName: currentUser ? `${currentUser.fullName} (${currentUser.jabatan.split(' ')[0]} ${currentUser.jabatan.split(' ')[1] || ''})` : "Tim Irban Khusus Investigasi",
          publishedToReporter: true
        };
      }
      return stg;
    });

    setLocalStages(updated);
    setSelectedStageForEdit(null);
    setActiveStageNoteInput('');

    // Langsung auto-save ke Admin WBS
    onUpdateStageProgress(
      currentReport.ticketCode,
      updated,
      `Catatan BAP/Hasil Tahap ${selectedStageForEdit.stageNumber}: ${activeStageNoteInput.substring(0, 80)}...`,
      true
    );

    setSuccessToast(`Catatan hasil pemeriksaan Tahap ${selectedStageForEdit.stageNumber} berhasil disimpan dan langsung terbaca di Admin WBS.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Submit all progress updates directly to Admin & System
  const handleSendProgressToAdmin = () => {
    if (!currentReport) return;

    onUpdateStageProgress(
      currentReport.ticketCode,
      localStages,
      generalIrbanNotes,
      true,
      currentReport.status
    );

    setSuccessToast(`Seluruh progres 6 tahapan kasus ${currentReport.ticketCode} berhasil dikirim ke Admin WBS dan siap dipublikasikan ke pelapor!`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleOpenPrint = (sprint: SuratPerintah) => {
    setActiveSprintToPrint(sprint);
    setShowPrintModal(true);
  };

  // Filter list
  const filteredReports = assignedReports.filter(rep => {
    const matchesSearch = 
      rep.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const repStarted = (
      rep.status === 'INVESTIGASI' || 
      rep.status === 'TINDAK_LANJUT' || 
      (rep.investigationStages && rep.investigationStages.some(s => s.status === 'SEDANG_BERJALAN' || s.status === 'SELESAI'))
    );

    if (filterMode === 'ACTIVE') return repStarted && rep.status !== 'SELESAI';
    if (filterMode === 'NEED_START') return !repStarted && rep.status !== 'SELESAI';
    if (filterMode === 'DONE') return rep.status === 'SELESAI';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      
      {/* Header Banner - Irban Investigasi */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                Portal Inspektur Pembantu Investigasi (Irban Khusus)
              </span>
              <span className="bg-slate-800 text-purple-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                Kabupaten Teluk Wondama
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync ke Admin WBS Aktif
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tindak Lanjut & Pelaksanaan Investigasi Kasus (APIP)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ketika kasus mulai dijalankan, progres tahapan otomatis aktif dan status langsung diperbarui secara realtime sehingga terbaca langsung oleh Admin WBS dan siap dipublikasikan ke pelapor.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl text-center flex-1 lg:flex-none lg:w-36">
              <div className="text-2xl font-black text-purple-400 font-mono">{assignedReports.length}</div>
              <div className="text-xs text-slate-300 font-semibold">Total Ditugaskan</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl text-center flex-1 lg:flex-none lg:w-36">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {assignedReports.filter(r => r.status === 'INVESTIGASI' || r.status === 'TINDAK_LANJUT').length}
              </div>
              <div className="text-xs text-slate-300 font-semibold">Sedang Berjalan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </motion.div>
      )}

      {assignedReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xl">
          <FileSignature className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-black text-slate-800">Belum Ada Surat Perintah Tugas Masuk</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Inspektur belum menerbitkan Surat Perintah Tugas (Sprint) untuk penugasan tim investigasi. Silakan pantau portal ini secara berkala.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Assigned Cases List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Daftar Tugas Irban
                </h3>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {assignedReports.length} Kasus
                </span>
              </div>

              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nomor tiket / judul..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setFilterMode('ALL')}
                    className={`py-1 rounded-lg transition ${filterMode === 'ALL' ? 'bg-white text-purple-900 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('ACTIVE')}
                    className={`py-1 rounded-lg transition ${filterMode === 'ACTIVE' ? 'bg-white text-purple-900 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('NEED_START')}
                    className={`py-1 rounded-lg transition ${filterMode === 'NEED_START' ? 'bg-white text-amber-900 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Mulai
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('DONE')}
                    className={`py-1 rounded-lg transition ${filterMode === 'DONE' ? 'bg-white text-emerald-900 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Tuntas
                  </button>
                </div>
              </div>

              {/* Case Cards List */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredReports.map((rep) => {
                  const isSelected = rep.ticketCode === currentReport?.ticketCode;
                  const sprint = rep.suratPerintah;
                  const repProgress = rep.investigationProgressPercent || 0;
                  const isRepActive = rep.status === 'INVESTIGASI' || rep.status === 'TINDAK_LANJUT';
                  
                  return (
                    <div
                      key={rep.id}
                      onClick={() => handleSelectReport(rep)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20 ring-2 ring-purple-400'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {rep.ticketCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 
                          isRepActive ? 'bg-purple-100 text-purple-700' :
                          rep.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-black leading-snug line-clamp-2">
                        {rep.subject}
                      </h4>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className={isSelected ? 'text-purple-200' : 'text-slate-500'}>
                          {sprint ? `Sprint: ${sprint.nomorSprint.split('/')[1] || sprint.nomorSprint}` : 'Disposisi Baru'}
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-purple-700'}`}>
                          {repProgress}% Tuntas
                        </span>
                      </div>

                      {/* Mini progress line */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-purple-800' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all duration-300 ${isSelected ? 'bg-white' : 'bg-purple-600'}`}
                          style={{ width: `${repProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Case Details & Live Stage Clicker (8 Cols) */}
          {currentReport && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* STATUS & SINKRONISASI REALTIME KE ADMIN WBS */}
              <div className="bg-white border border-purple-200 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                        {currentReport.ticketCode}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                        currentReport.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        currentReport.status === 'INVESTIGASI' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        currentReport.status === 'TINDAK_LANJUT' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        Status: {currentReport.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        Sinkron ke Admin WBS: <strong className="text-slate-800">Aktif Realtime</strong>
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">{currentReport.subject}</h2>
                  </div>

                  {/* Cetak Berita Acara & Sprint Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPrintBaModal(true)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                      title="Cetak Berita Acara Tanda Terima Laporan Resmi"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cetak Berita Acara</span>
                    </button>

                    {currentReport.suratPerintah && (
                      <button
                        type="button"
                        onClick={() => handleOpenPrint(currentReport.suratPerintah!)}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <FileSignature className="w-3.5 h-3.5 text-purple-700" />
                        <span>Lihat Sprint</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Switcher Langsung */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        Pembaruan Status Penanganan Langsung di Irban:
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Klik status di bawah ini untuk memperbarui status kasus secara instan; perubahan langsung terbaca di Dashboard Admin WBS.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleChangeStatusDirectly('INVESTIGASI')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                          currentReport.status === 'INVESTIGASI'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>Investigasi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChangeStatusDirectly('TINDAK_LANJUT')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                          currentReport.status === 'TINDAK_LANJUT'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>Tindak Lanjut</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChangeStatusDirectly('SELESAI')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                          currentReport.status === 'SELESAI'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Selesai</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Surat Perintah Quick Info */}
                {currentReport.suratPerintah && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-900">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-600 block">Surat Perintah (Sprint):</span>
                      <p className="font-mono font-bold">{currentReport.suratPerintah.nomorSprint}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-600 block">Lokasi Pemeriksaan:</span>
                      <p className="font-semibold truncate">{currentReport.suratPerintah.lokasiPemeriksaan}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-600 block">Jadwal Tugas:</span>
                      <p className="font-semibold">
                        {new Date(currentReport.suratPerintah.tanggalMulai).toLocaleDateString('id-ID')} s/d {new Date(currentReport.suratPerintah.tanggalSelesai).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION CARD: MULAI JALANKAN KASUS (Jika Kasus Belum Berjalan) */}
              {!isStarted && (
                <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4 border border-purple-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          Kasus Belum Dijalankan
                        </span>
                        <span className="text-xs text-purple-200 font-semibold">
                          Menunggu Aktivasi Prosedur Investigasi Lapangan
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        Mulai Jalankan Investigasi Kasus Ini Sekarang
                      </h3>
                      <p className="text-xs text-purple-100 max-w-xl leading-relaxed">
                        Klik tombol di samping untuk mengaktifkan prosedur penanganan kasus secara resmi. Alur tahapan 1 s/d 6 dan status akan langsung bergerak dan terbaca di Admin WBS.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartInvestigation(currentReport)}
                      className="px-6 py-4 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 shrink-0 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Mulai Jalankan Investigasi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CARD POSISI PROGRES INVESTIGASI (SAMPAI DI MANA SESUAI ALUR) */}
              <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-purple-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/60 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Posisi Alur Investigasi Saat Ini
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      Tahap {activeStage.stageNumber} dari 6: {activeStage.title.split('&')[0].trim()}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400 font-mono">{progressPercent}%</div>
                      <span className="text-[10px] text-purple-300 uppercase font-bold">Investigasi Tuntas</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="space-y-2">
                  <div className="w-full h-3 bg-purple-950/80 rounded-full overflow-hidden border border-purple-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.max(progressPercent, 6)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-purple-300">
                    <span>Tahap 1: RKAI</span>
                    <span>Tahap 3: Klarifikasi & BAP</span>
                    <span>Tahap 5: LHP</span>
                    <span>Tahap 6: Rekomendasi</span>
                  </div>
                </div>

                {/* Active Stage Details & Fast Advance Button */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-purple-200">Sedang Dikerjakan di Lapangan:</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{activeStage.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      {activeStage.notes || activeStage.description}
                    </p>
                  </div>

                  {/* Tombol Lanjut ke Tahap Berikutnya */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={handleAdvanceToNextStage}
                      className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {progressPercent >= 83 ? 'Selesaikan Investigasi Kasus (100%)' : `Selesaikan Tahap ${activeStage.stageNumber} & Masuk Tahap Berikutnya`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE 6-STAGE PROGRESS STEPPER & DETAILS */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      Rincian 6 Tahapan Investigasi (Klik untuk Perbarui Status)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Setiap status tahapan yang diklik atau diubah akan langsung terupdate ke sistem dan terbaca langsung oleh Admin WBS.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                      Tuntas: {progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-3">
                  {localStages.map((stage) => {
                    const isDone = stage.status === 'SELESAI';
                    const isRunning = stage.status === 'SEDANG_BERJALAN';
                    return (
                      <div
                        key={stage.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                            : isRunning
                            ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30 shadow-md'
                            : 'bg-slate-50 border-slate-200 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isDone ? 'bg-emerald-600 text-white shadow-sm' :
                              isRunning ? 'bg-purple-600 text-white animate-pulse shadow-md' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                              {isDone ? <Check className="w-4 h-4" /> : stage.stageNumber}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900">{stage.title}</h4>
                                {isRunning && (
                                  <span className="text-[10px] font-black bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                                    Tahap Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5">{stage.description}</p>
                            </div>
                          </div>

                          {/* Action Clicker Buttons for Stage Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStageStatus(stage.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                  : isRunning
                                  ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                              title="Klik untuk ubah status tahapan"
                            >
                              {isDone ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span>{stage.status.replace(/_/g, ' ')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStageForEdit(stage);
                                setActiveStageNoteInput(stage.notes || '');
                              }}
                              className="p-1.5 bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer shadow-sm"
                              title="Input Catatan Hasil Pemeriksaan & BAP"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                            </button>
                          </div>
                        </div>

                        {/* Stage Notes Display */}
                        {stage.notes && (
                          <div className="bg-white/90 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900">Catatan Hasil & BAP: </span>
                              <span>{stage.notes}</span>
                              {stage.actorName && (
                                <span className="text-slate-500 block text-[10px] mt-0.5">
                                  Pemeriksa: {stage.actorName}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Irban General Log / Summary */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Catatan Rangkuman / Temuan Investigasi Tambahan untuk Admin & Pelapor:
                  </label>
                  <textarea
                    rows={3}
                    value={generalIrbanNotes}
                    onChange={(e) => setGeneralIrbanNotes(e.target.value)}
                    placeholder="Tuliskan perkembangan terkini investigasi lapangan..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                {/* Final Submit Button to Admin */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendProgressToAdmin}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    Kirim & Publikasikan Pembaruan Progres ke Admin WBS
                  </button>
                </div>
              </div>

              {/* Case Information Summary */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Data Pendukung Pengaduan Awal
                  </h3>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-700">Uraian Kasus Terlapor:</span>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {decryptData(currentReport.descriptionEncrypted)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span><strong>Lokasi Kejadian:</strong> {currentReport.location}</span>
                  <span><strong>Indikasi Kerugian:</strong> {currentReport.estimatedLossRupiah ? `Rp ${currentReport.estimatedLossRupiah.toLocaleString('id-ID')}` : 'Non-Finansial'}</span>
                  <span><strong>Lampiran Dokumen:</strong> {currentReport.attachments.length} Berkas</span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* EDIT STAGE NOTE MODAL */}
      <AnimatePresence>
        {selectedStageForEdit && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Input Catatan Hasil: Tahap {selectedStageForEdit.stageNumber} ({selectedStageForEdit.title.split('&')[0].trim()})
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedStageForEdit(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStageNote} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hasil Pemeriksaan / Berita Acara Tahap Ini:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={activeStageNoteInput}
                    onChange={(e) => setActiveStageNoteInput(e.target.value)}
                    placeholder="Contoh: Telah dilaksanakan klarifikasi terhadap saksi PPK dan rekanan distributor pada 28 Agustus 2026..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStageForEdit(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Simpan Catatan & Sync Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT SURAT PERINTAH MODAL */}
      {showPrintModal && activeSprintToPrint && (
        <PrintSuratPerintah
          suratPerintah={activeSprintToPrint}
          report={currentReport || undefined}
          onClose={() => {
            setShowPrintModal(false);
            setActiveSprintToPrint(null);
          }}
        />
      )}

      {/* PRINT BERITA ACARA MODAL */}
      {showPrintBaModal && currentReport && (
        <PrintBeritaAcara
          report={currentReport}
          onClose={() => setShowPrintBaModal(false)}
        />
      )}

    </div>
  );
};
