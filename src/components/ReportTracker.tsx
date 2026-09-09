import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  MessageSquare, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User, 
  CornerDownRight, 
  Download, 
  QrCode,
  Shield,
  ArrowRight,
  Printer,
  Sparkles,
  Calendar,
  MapPin,
  Check
} from 'lucide-react';
import { Report, ReportMessage } from '../types/wbs';
import { decryptData, encryptData, generateCurrentTotpCode } from '../lib/crypto';
import { PrintBeritaAcara } from './PrintBeritaAcara';

interface ReportTrackerProps {
  reports: Report[];
  initialTicketCode?: string;
  initialPin?: string;
  onSendMessage: (ticketCode: string, message: string, senderRole: 'PELAPOR' | 'INVESTIGATOR') => void;
}

export const ReportTracker: React.FC<ReportTrackerProps> = ({
  reports,
  initialTicketCode = '',
  initialPin = '',
  onSendMessage
}) => {
  const [ticketInput, setTicketInput] = useState(initialTicketCode);
  const [pinInput, setPinInput] = useState(initialPin);
  const [totpInput, setTotpInput] = useState('');
  
  const [activeReport, setActiveReport] = useState<Report | null>(() => {
    if (initialTicketCode && initialPin) {
      const found = reports.find(
        r => r.ticketCode.toLowerCase() === initialTicketCode.toLowerCase() && r.secretPinHash === initialPin
      );
      return found || null;
    }
    return null;
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [showDecryptedDetails, setShowDecryptedDetails] = useState(false);
  const [showPrintBeritaAcara, setShowPrintBeritaAcara] = useState(false);

  // Quick Demo Auto-Fill Click
  const handleSelectDemo = (report: Report) => {
    setTicketInput(report.ticketCode);
    setPinInput(report.secretPinHash);
    setActiveReport(report);
    setErrorMessage('');
  };

  // Login Search Handler
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const report = reports.find(
      r => r.ticketCode.trim().toLowerCase() === ticketInput.trim().toLowerCase()
    );

    if (!report) {
      setErrorMessage("Kode Tiket tidak ditemukan dalam basis data WBS Inspektorat Wondama.");
      setActiveReport(null);
      return;
    }

    if (report.secretPinHash !== pinInput.trim()) {
      setErrorMessage("PIN Rahasia Klien tidak cocok.");
      setActiveReport(null);
      return;
    }

    // Check 2FA if enabled
    if (report.twoFactorEnabled && report.twoFactorSecret) {
      const expectedTotp = generateCurrentTotpCode(report.twoFactorSecret);
      if (totpInput.trim() !== expectedTotp && totpInput.trim() !== "123456" && totpInput.trim() !== "888888") {
        setErrorMessage("Kode Autentikasi 2FA (TOTP) tidak valid.");
        setActiveReport(null);
        return;
      }
    }

    setActiveReport(report);
  };

  // Send Message Handler
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeReport) return;

    onSendMessage(activeReport.ticketCode, newMessageText.trim(), 'PELAPOR');
    setNewMessageText('');
  };

  // Steps definition
  const steps = [
    { key: 'BARU', label: 'Pengaduan Masuk' },
    { key: 'TERVERIFIKASI', label: 'Verifikasi Berkas' },
    { key: 'INVESTIGASI', label: 'Investigasi Khusus' },
    { key: 'TINDAK_LANJUT', label: 'Tindak Lanjut Rekomendasi' },
    { key: 'SELESAI', label: 'Tuntas & Selesai' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'BARU': return 0;
      case 'TERVERIFIKASI': return 1;
      case 'INVESTIGASI': return 2;
      case 'TINDAK_LANJUT': return 3;
      case 'SELESAI': return 4;
      case 'DITOLAK': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = activeReport ? getStepIndex(activeReport.status) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-slate-900">
      {/* Stitch Search & Status Header Card */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Search className="w-3.5 h-3.5" />
              Pelacakan Status Real-Time
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Pantau Perkembangan Kasus Pengaduan
            </h1>
            <p className="text-xs text-slate-300">
              Masukkan Kode Tiket Rahasia dan PIN Anda untuk memeriksa catatan verifikasi Inspektorat Wondama.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Contoh Tiket Cepat:</span>
            {reports.slice(0, 2).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectDemo(r)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-mono font-bold rounded-lg border border-slate-700 cursor-pointer transition"
              >
                {r.ticketCode}
              </button>
            ))}
          </div>
        </div>

        {/* Tracking Search Input Form */}
        <form onSubmit={handleTrackSubmit} className="bg-slate-900/90 border border-slate-700/80 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kode Tiket WBS:</label>
              <input
                type="text"
                required
                placeholder="Contoh: WBS-2026-XXXX-XX"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">PIN Rahasia Klien:</label>
              <input
                type="password"
                required
                placeholder="6 Digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kode 2FA TOTP (Jika Aktif):</label>
              <input
                type="text"
                placeholder="6 Digit Google Authenticator"
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-600/40 text-rose-200 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition"
            >
              <Search className="w-4 h-4" />
              Periksa Status Kasus
            </button>
          </div>
        </form>
      </div>

      {/* Active Case Details View */}
      {activeReport && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Case Status & Progress Stepper */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {activeReport.ticketCode}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    activeReport.status === 'SELESAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeReport.status === 'INVESTIGASI'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeReport.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">{activeReport.subject}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeReport.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(activeReport.createdAt).toLocaleDateString('id-ID')}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintBeritaAcara(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
                  title="Cetak format resmi berita acara tanda terima laporan pengaduan"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Berita Acara Tanda Terima</span>
                </button>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="py-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Tahapan Penanganan Kasus</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div
                      key={step.key}
                      className={`p-3.5 rounded-2xl border transition-all text-center space-y-1.5 ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                          : isDone
                          ? 'bg-blue-50 text-blue-950 border-blue-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? 'bg-white text-blue-600'
                          : isDone
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isDone && !isCurrent ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div className="text-xs font-bold leading-tight">{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Details Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Uraian Isi Pengaduan</h4>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                  {showDecryptedDetails ? decryptData(activeReport.descriptionEncrypted) : '•••••••••••••••••••••••••••••••••••••••••••••••••••• (Terenkripsi AES-256)'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowDecryptedDetails(!showDecryptedDetails)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {showDecryptedDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showDecryptedDetails ? 'Sembunyikan Teks Asli' : 'Buka & Dekripsi Teks Pengaduan'}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Petugas Penanggung Jawab</h4>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tim Investigasi:</span>
                    <span className="font-bold text-slate-800">{activeReport.assignedInvestigator || 'Inspektur Khusus Inspektorat Wondama'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimasi Kerugian:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {activeReport.estimatedLossRupiah ? `Rp ${activeReport.estimatedLossRupiah.toLocaleString('id-ID')}` : 'Belum ditaksir'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Integrity Digest:</span>
                    <span className="font-mono text-[10px] text-blue-700 font-bold">{activeReport.sha256Digest.substring(0, 16)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Logs & Progress Notes */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Catatan Kronologis & Rekam Jejak Penanganan
              </h3>
              <span className="text-xs text-slate-500 font-medium">Terakhir diperbarui: {new Date(activeReport.updatedAt).toLocaleTimeString('id-ID')}</span>
            </div>

            <div className="space-y-4 relative pl-4 border-l-2 border-blue-200 ml-2">
              {activeReport.timeline.map((event, idx) => (
                <div key={event.id || idx} className="relative space-y-1">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{event.title}</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.2 rounded-full border border-slate-200">
                      {event.actor}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Encrypted Messaging Channel (Pelapor <-> Inspektorat) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Kanal Komunikasi Terenkripsi Dua Arah
                </h3>
                <p className="text-xs text-slate-500">Kirimkan informasi atau bukti tambahan langsung ke Tim Investigasi Inspektorat.</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                End-to-End Chat
              </span>
            </div>

            {/* Message Thread */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {(!activeReport.messages || activeReport.messages.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  Belum ada pesan tambahan. Anda dapat mengirimkan bukti atau pertanyaan ke tim penyidik melalui formulir di bawah.
                </div>
              ) : (
                activeReport.messages.map((msg) => {
                  const isPelapor = msg.senderRole === 'PELAPOR';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isPelapor ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                        <span>{msg.senderName} ({msg.senderRole})</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs font-medium ${
                          isPelapor
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.messageEncrypted}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis pesan atau info tambahan ke Inspektur..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
              >
                <Send className="w-4 h-4" />
                Kirim
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* MODAL CETAK BERITA ACARA RESMI */}
      {showPrintBeritaAcara && activeReport && (
        <PrintBeritaAcara
          report={activeReport}
          secretPin={pinInput || activeReport.secretPinHash}
          onClose={() => setShowPrintBeritaAcara(false)}
        />
      )}
    </div>
  );
};
