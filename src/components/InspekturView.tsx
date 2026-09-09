import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  Printer, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Calendar, 
  MapPin, 
  Building, 
  Search, 
  Eye, 
  FileSignature, 
  Sparkles,
  Layers,
  ChevronRight,
  Bell,
  Check,
  Award,
  AlertCircle
} from 'lucide-react';
import { Report, SuratPerintah, SuratPerintahTeamMember, ReportStatus, UserAccount } from '../types/wbs';
import { decryptData } from '../lib/crypto';
import { 
  DEFAULT_DASAR_HUKUM, 
  DEFAULT_PEJABAT_PENANDATANGAN, 
  AVAILABLE_INVESTIGATORS, 
  generateSprintNumber,
  createDefaultInvestigationStages
} from '../lib/investigationWorkflow';
import { PrintSuratPerintah } from './PrintSuratPerintah';

interface InspekturViewProps {
  reports: Report[];
  onCreateSprint: (ticketCode: string, sprintData: SuratPerintah) => void;
  onUpdateReportStatus: (ticketCode: string, status: ReportStatus, title: string, desc: string) => void;
  currentUser?: UserAccount | null;
}

export const InspekturView: React.FC<InspekturViewProps> = ({
  reports,
  onCreateSprint,
  onUpdateReportStatus,
  currentUser
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'DISPOSISI_MASUK' | 'SURAT_PERINTAH' | 'PROGRESS_IRBAN'>('DISPOSISI_MASUK');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeSprintToPrint, setActiveSprintToPrint] = useState<SuratPerintah | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for creating Surat Perintah
  const [sprintNumber, setSprintNumber] = useState('');
  const [sprintPerihal, setSprintPerihal] = useState('');
  const [lokasiPemeriksaan, setLokasiPemeriksaan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<SuratPerintahTeamMember[]>([]);
  const [instruksiTambahan, setInstruksiTambahan] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Filter reports that have been verified by Admin
  const verifiedReports = reports.filter(r => 
    r.adminVerification?.forwardedToInspektur || 
    r.status === 'TERVERIFIKASI' || 
    r.status === 'INVESTIGASI' || 
    r.status === 'TINDAK_LANJUT' || 
    r.status === 'SELESAI'
  );

  const pendingSprintReports = verifiedReports.filter(r => !r.suratPerintah && r.adminVerification?.isFeasible);
  const activeSprintReports = reports.filter(r => !!r.suratPerintah);

  const handleOpenCreateSprint = (report: Report) => {
    setSelectedReport(report);
    setSprintNumber(generateSprintNumber(Math.floor(Math.random() * 80) + 20));
    setSprintPerihal(`Pemeriksaan / Audit Investigatif atas ${report.subject}`);
    setLokasiPemeriksaan(report.location || 'Wilayah Kerja Pemerintah Kabupaten Teluk Wondama');
    
    const today = new Date().toISOString().split('T')[0];
    const next14Days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setTanggalMulai(today);
    setTanggalSelesai(next14Days);
    setSelectedTeam(AVAILABLE_INVESTIGATORS.slice(0, 3));
    setInstruksiTambahan(`1. Melakukan klarifikasi dan pengumpulan bukti secara tertutup dan profesional.\n2. Melaporkan kemajuan investigasi secara berkala pada aplikasi WBS Inspektorat Teluk Wondama.`);
    setShowCreateSprintModal(true);
  };

  const handleToggleTeamMember = (member: SuratPerintahTeamMember) => {
    if (selectedTeam.some(m => m.id === member.id)) {
      setSelectedTeam(selectedTeam.filter(m => m.id !== member.id));
    } else {
      setSelectedTeam([...selectedTeam, member]);
    }
  };

  const handleSaveAndIssueSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    const newSprint: SuratPerintah = {
      id: `sprint-${Date.now()}`,
      reportTicketCode: selectedReport.ticketCode,
      nomorSprint: sprintNumber,
      perihal: sprintPerihal,
      dasarHukum: DEFAULT_DASAR_HUKUM,
      menimbang: [
        "Bahwa terdapat laporan pengaduan masyarakat yang telah diverifikasi layak untuk ditindaklanjuti dengan audit investigatif.",
        "Bahwa untuk mewujudkan tata kelola keuangan yang bersih, akuntabel, dan bebas dari korupsi di Kabupaten Teluk Wondama.",
        "Bahwa pejabat/auditor yang ditunjuk dalam surat perintah ini dipandang cakap dan memenuhi integritas pemeriksaan."
      ],
      untuk: [
        `Melaksanakan pemeriksaan/audit investigatif dugaan pelanggaran: ${selectedReport.subject}.`,
        "Melakukan permintaan keterangan, berita acara pemeriksaan (BAP), dan uji petik dokumen/fisik di lapangan.",
        "Menyampaikan Laporan Hasil Pemeriksaan (LHP) kepada Inspektur Daerah Kabupaten Teluk Wondama."
      ],
      lokasiPemeriksaan: lokasiPemeriksaan,
      tanggalMulai: tanggalMulai,
      tanggalSelesai: tanggalSelesai,
      pejabatPenandatangan: currentUser ? {
        nama: currentUser.fullName,
        nip: currentUser.nip,
        jabatan: currentUser.jabatan,
        pangkatGolongan: currentUser.pangkatGolongan
      } : DEFAULT_PEJABAT_PENANDATANGAN,
      timPemeriksa: selectedTeam.length > 0 ? selectedTeam : AVAILABLE_INVESTIGATORS.slice(0, 3),
      tanggalTerbit: new Date().toISOString(),
      status: 'DITERBITKAN',
      digitalSignatureHash: `sha256-sig-${Math.random().toString(36).substring(2, 15)}${Date.now()}`,
      qrVerificationUrl: `https://wbs.inspektoratwondama.go.id/verify-sprint/${sprintNumber.replace(/[\/\s]/g, '-')}`
    };

    onCreateSprint(selectedReport.ticketCode, newSprint);
    setShowCreateSprintModal(false);
    setSuccessNotice(`Surat Perintah Tugas ${sprintNumber} berhasil diterbitkan dan langsung didisposisikan ke Irban Investigasi!`);
    setTimeout(() => setSuccessNotice(''), 6000);
  };

  const handleOpenPrint = (sprint: SuratPerintah, report?: Report) => {
    setActiveSprintToPrint(sprint);
    setSelectedReport(report || null);
    setShowPrintModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      
      {/* Header Banner - Inspektur Command Station */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Portal Pimpinan • Inspektur Daerah
              </span>
              <span className="bg-slate-800 text-blue-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                Kabupaten Teluk Wondama
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Penerbitan Surat Perintah Tugas & Pengawasan Investigasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Menerima hasil verifikasi kelayakan dari Admin secara in-app, menerbitkan Surat Perintah (Sprint/SPT) ber-QR Code resmi, mencetak dokumen tugas, dan memantau kemajuan investigasi Irban.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
              <div className="text-xl font-black text-amber-400 font-mono">{pendingSprintReports.length}</div>
              <div className="text-[11px] text-slate-300 font-semibold">Menunggu Sprint</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
              <div className="text-xl font-black text-blue-400 font-mono">{activeSprintReports.length}</div>
              <div className="text-[11px] text-slate-300 font-semibold">Sprint Diterbitkan</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl text-center col-span-2 sm:col-span-1">
              <div className="text-xl font-black text-emerald-400 font-mono">
                {reports.filter(r => r.status === 'SELESAI').length}
              </div>
              <div className="text-[11px] text-slate-300 font-semibold">Kasus Tuntas</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedSubTab('DISPOSISI_MASUK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              selectedSubTab === 'DISPOSISI_MASUK'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            Pengaduan Terverifikasi dari Admin ({pendingSprintReports.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedSubTab('SURAT_PERINTAH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              selectedSubTab === 'SURAT_PERINTAH'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            Daftar Surat Perintah (Sprint/SPT) ({activeSprintReports.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedSubTab('PROGRESS_IRBAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              selectedSubTab === 'PROGRESS_IRBAN'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Monitoring Progres Irban Investigasi
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </motion.div>
      )}

      {/* TAB 1: DISPOSISI MASUK DARI ADMIN */}
      {selectedSubTab === 'DISPOSISI_MASUK' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Notifikasi Pengaduan Masuk yang Telah Diverifikasi Admin
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar laporan yang telah diteliti bukti awal dan kelayakannya oleh tim verifikator untuk diputuskan penerbitan Surat Perintah Tugas (SPT).
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tiket / subjek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 w-full sm:w-64"
                />
              </div>
            </div>

            {verifiedReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Belum ada pengaduan terverifikasi yang didisposisikan oleh Admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {verifiedReports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 hover:bg-white hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                          {report.ticketCode}
                        </span>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                          report.severity === 'KRITIS' ? 'bg-rose-100 text-rose-800' :
                          report.severity === 'TINGGI' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          Urgensi: {report.severity}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {report.adminVerification?.isFeasible ? 'LAYAK INVESTIGASI' : 'TERVERIFIKASI'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Disposisi: {report.adminVerification?.forwardedAt ? new Date(report.adminVerification.forwardedAt).toLocaleString('id-ID') : new Date(report.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900">{report.subject}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 bg-white p-3 rounded-xl border border-slate-200">
                          {decryptData(report.descriptionEncrypted)}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {report.location}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            Estimasi: {report.estimatedLossRupiah ? `Rp ${report.estimatedLossRupiah.toLocaleString('id-ID')}` : 'Non-Finansial'}
                          </span>
                          <span className="text-blue-600 font-semibold">
                            {report.attachments.length} Dokumen Bukti
                          </span>
                        </div>
                      </div>

                      {/* Catatan Verifikasi Admin */}
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Rekomendasi Admin WBS:
                          </div>
                          <p className="text-xs text-amber-950 font-medium leading-snug mt-1">
                            "{report.adminVerification?.reason || 'Bukti awal terkonfirmasi valid dan memenuhi unsur pengaduan WBS.'}"
                          </p>
                          <div className="text-[10px] text-amber-700 font-semibold mt-1">
                            Verifikator: {report.adminVerification?.verifiedBy || 'Admin Pengawasan'}
                          </div>
                        </div>

                        <div className="pt-2">
                          {report.suratPerintah ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex-1 text-center">
                                Sprint: {report.suratPerintah.nomorSprint}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenPrint(report.suratPerintah!, report)}
                                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                title="Cetak Surat Perintah"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenCreateSprint(report)}
                              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <FileSignature className="w-4 h-4" />
                              Buat Surat Perintah (Sprint)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR SURAT PERINTAH (SPRINT) */}
      {selectedSubTab === 'SURAT_PERINTAH' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                  Daftar Surat Perintah Tugas (SPT/Sprint) yang Telah Diterbitkan
                </h2>
                <p className="text-xs text-slate-500">
                  Seluruh Surat Perintah resmi bertandatangan elektronik untuk tim Irban Investigasi.
                </p>
              </div>
            </div>

            {activeSprintReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Belum ada Surat Perintah Tugas yang diterbitkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSprintReports.map((report) => {
                  const sprint = report.suratPerintah!;
                  return (
                    <div
                      key={sprint.id}
                      className="border border-slate-200 rounded-3xl p-5 sm:p-6 bg-slate-50 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-mono font-black text-xs text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                            {sprint.nomorSprint}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {new Date(sprint.tanggalTerbit).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-slate-900">{sprint.perihal}</h3>
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {sprint.lokasiPemeriksaan}
                          </p>
                        </div>

                        {/* Tim Pemeriksa list */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            Tim Pemeriksa ({sprint.timPemeriksa.length} Personel):
                          </span>
                          <ul className="text-xs space-y-1 text-slate-700">
                            {sprint.timPemeriksa.map((t, idx) => (
                              <li key={idx} className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-slate-900">{t.name}</span>
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.2 rounded-md">
                                  {t.peranTim.replace(/_/g, ' ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(sprint, report)}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          <Printer className="w-4 h-4" />
                          Cetak Surat Perintah (Print / PDF)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROGRESS IRBAN INVESTIGASI */}
      {selectedSubTab === 'PROGRESS_IRBAN' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Matriks Tahapan Penanganan Kasus oleh Irban Investigasi
              </h2>
              <p className="text-xs text-slate-500">
                Pimpinan dapat memantau secara real-time pengisian progres, Berita Acara, dan penyusunan naskah Laporan Hasil Pemeriksaan (LHP).
              </p>
            </div>

            {activeSprintReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Belum ada kasus yang dalam tahap investigasi aktif.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeSprintReports.map((report) => (
                  <div key={report.id} className="border border-slate-200 rounded-3xl p-6 bg-slate-50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                            {report.ticketCode}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            Sprint: {report.suratPerintah?.nomorSprint}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mt-1">{report.subject}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                          Progres: {report.investigationProgressPercent || 50}%
                        </span>
                      </div>
                    </div>

                    {/* Stage Timeline Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {(report.investigationStages || createDefaultInvestigationStages()).map((stg) => (
                        <div
                          key={stg.id}
                          className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                            stg.status === 'SELESAI'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                              : stg.status === 'SEDANG_BERJALAN'
                              ? 'bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-400/30'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-[11px]">Tahap {stg.stageNumber}</span>
                            <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                              stg.status === 'SELESAI' ? 'bg-emerald-200 text-emerald-800' :
                              stg.status === 'SEDANG_BERJALAN' ? 'bg-blue-200 text-blue-800 animate-pulse' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {stg.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">{stg.title}</p>
                          {stg.notes && (
                            <p className="text-[11px] text-slate-600 bg-white/70 p-1.5 rounded-lg border border-slate-100 mt-1">
                              "{stg.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {report.irbanNotes && (
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700">Catatan Khusus Irban Investigasi:</span>
                        <p className="text-slate-600 italic mt-0.5">"{report.irbanNotes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: BUAT SURAT PERINTAH TUGAS (SPRINT) */}
      <AnimatePresence>
        {showCreateSprintModal && selectedReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 border border-slate-200 my-8"
            >
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Formulir Penerbitan Surat Perintah Tugas</h3>
                    <p className="text-xs text-slate-500 font-mono">Ref Tiket: {selectedReport.ticketCode}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateSprintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAndIssueSprint} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Surat Perintah Tugas (SPT):</label>
                    <input
                      type="text"
                      required
                      value={sprintNumber}
                      onChange={(e) => setSprintNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Sasaran Pemeriksaan:</label>
                    <input
                      type="text"
                      required
                      value={lokasiPemeriksaan}
                      onChange={(e) => setLokasiPemeriksaan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perihal Tugas Pemeriksaan:</label>
                  <input
                    type="text"
                    required
                    value={sprintPerihal}
                    onChange={(e) => setSprintPerihal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Tugas:</label>
                    <input
                      type="date"
                      required
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai (Target LHP):</label>
                    <input
                      type="date"
                      required
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Pilih Tim Pemeriksa */}
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-800">
                    Pilih Susunan Tim Pemeriksa / Irban Investigasi:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {AVAILABLE_INVESTIGATORS.map((member) => {
                      const isSelected = selectedTeam.some(m => m.id === member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => handleToggleTeamMember(member)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-xs">{member.name}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              {member.jabatan}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {member.peranTim.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instruksi Khusus Pimpinan:</label>
                  <textarea
                    rows={3}
                    value={instruksiTambahan}
                    onChange={(e) => setInstruksiTambahan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="Instruksi tambahan..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateSprintModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <FileSignature className="w-4 h-4" />
                    Terbitkan & Disposisi ke Irban
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
          report={selectedReport || undefined}
          onClose={() => {
            setShowPrintModal(false);
            setActiveSprintToPrint(null);
          }}
        />
      )}
    </div>
  );
};
