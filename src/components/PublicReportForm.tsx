import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Lock, 
  UserX, 
  UserCheck, 
  KeyRound, 
  Sparkles, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Copy, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  QrCode, 
  ArrowRight, 
  HelpCircle, 
  Check, 
  Send, 
  HeartHandshake, 
  Info,
  Building2,
  Calendar,
  DollarSign,
  FileCheck,
  Zap,
  Mail,
  Printer
} from 'lucide-react';
import { Report, AnonymityType, ReportCategory, SeverityLevel, ReportAttachment } from '../types/wbs';
import { encryptData, generateTicketCode, generateSecretPin, generateTotpSecret, computeSha256Digest } from '../lib/crypto';
import QRCode from 'qrcode';
import { PrintBeritaAcara } from './PrintBeritaAcara';

interface PublicReportFormProps {
  onReportSubmitted: (newReport: Report) => void;
  onNavigateToTrack: (ticketCode: string, pin: string) => void;
  inspectorEmail: string;
}

export const PublicReportForm: React.FC<PublicReportFormProps> = ({
  onReportSubmitted,
  onNavigateToTrack,
  inspectorEmail
}) => {
  // Reporter Interface Mode: 'SIMPLE' (Super Sederhana) or 'ADVANCED' (Lanjutan)
  const [reportMode, setReportMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');

  // Simple Mode Wizard Step State (1: Masalah, 2: Kronologi Singkat, 3: Selesai)
  const [simpleStep, setSimpleStep] = useState<number>(1);
  const [simpleCategory, setSimpleCategory] = useState<string>('KORUPSI_GRATIFIKASI');
  const [simpleSubject, setSimpleSubject] = useState<string>('');
  const [simpleDescription, setSimpleDescription] = useState<string>('');
  const [simpleLocation, setSimpleLocation] = useState<string>('Distrik Rasiei, Kab. Teluk Wondama');

  // Advanced Form State
  const [anonymity, setAnonymity] = useState<AnonymityType>('ANONYMOUS');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);

  const [category, setCategory] = useState<ReportCategory>('PENGADAAN_BARANG_JASA');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedLoss, setEstimatedLoss] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('SEDANG');

  // Encryption & AI State
  const [showEncryptedPreview, setShowEncryptedPreview] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  // Submission Receipt Modal State
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [generatedPin, setGeneratedPin] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [showPrintBeritaAcara, setShowPrintBeritaAcara] = useState(false);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<{
    inspectorSent: boolean;
    reporterSent: boolean;
    inspectorTarget: string;
    reporterTarget?: string;
  } | null>(null);

  // Trigger Gemini AI Risk Assessment
  const handleAnalyzeWithAi = async () => {
    const textDesc = reportMode === 'SIMPLE' ? simpleDescription : description;
    if (!textDesc || textDesc.length < 10) {
      alert("Harap isi uraian pengaduan minimal 10 karakter untuk dianalisis oleh AI.");
      return;
    }

    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: reportMode === 'SIMPLE' ? simpleCategory : category,
          subject: (reportMode === 'SIMPLE' ? simpleSubject : subject) || "Pengaduan Baru",
          description: textDesc,
          location: reportMode === 'SIMPLE' ? simpleLocation : location,
          estimatedLossRupiah: parseFloat(estimatedLoss) || 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Attach File Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAtts: ReportAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const hash = await computeSha256Digest(file.name + file.size + Date.now());

      newAtts.push({
        id: `att-${Date.now()}-${i}`,
        fileName: file.name,
        fileSize: fileSizeMb,
        fileType: file.type || "application/octet-stream",
        encryptedHash: hash,
        uploadedAt: new Date().toISOString()
      });
    }

    setAttachments(prev => [...prev, ...newAtts]);
    setUploading(false);
  };

  // Process Final Submission (Both Simple & Advanced)
  const processReportSubmission = async (
    finalSubject: string,
    finalDesc: string,
    finalCat: ReportCategory,
    finalLoc: string
  ) => {
    const ticketCode = generateTicketCode();
    const pin = generateSecretPin();
    const totpSecret = enable2FA ? generateTotpSecret() : undefined;
    const encryptedDesc = encryptData(finalDesc);
    const shaDigest = await computeSha256Digest(ticketCode + finalDesc + Date.now());

    if (totpSecret) {
      try {
        const otpauthUrl = `otpauth://totp/WBS-Inspektorat:${ticketCode}?secret=${totpSecret}&issuer=WBS-Inspektorat`;
        const qr = await QRCode.toDataURL(otpauthUrl);
        setQrCodeUrl(qr);
      } catch (err) {
        console.error("Failed to generate QR Code", err);
      }
    }

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      ticketCode,
      secretPinHash: pin,
      anonymity: reportMode === 'SIMPLE' ? 'ANONYMOUS' : anonymity,
      reporterNameEncrypted: anonymity === 'CONFIDENTIAL_IDENTIFIED' && reporterName ? encryptData(reporterName) : undefined,
      reporterEmail: reporterEmail || undefined,
      reporterEmailEncrypted: anonymity === 'CONFIDENTIAL_IDENTIFIED' && reporterEmail ? encryptData(reporterEmail) : undefined,
      reporterPhoneEncrypted: anonymity === 'CONFIDENTIAL_IDENTIFIED' && reporterPhone ? encryptData(reporterPhone) : undefined,
      twoFactorEnabled: enable2FA,
      twoFactorSecret: totpSecret,
      category: finalCat,
      subject: finalSubject || "Laporan Pengaduan Pelanggaran",
      descriptionEncrypted: encryptedDesc,
      location: finalLoc || "Kabupaten Teluk Wondama",
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      estimatedLossRupiah: parseFloat(estimatedLoss) || undefined,
      status: 'BARU',
      severity: severity || 'SEDANG',
      sha256Digest: shaDigest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: attachments,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          reportId: `rep-${Date.now()}`,
          status: 'BARU',
          title: 'Pengaduan Terdaftar',
          description: 'Laporan pengaduan berhasil dienkripsi dan masuk ke antrean verifikasi Inspektorat Wondama.',
          actor: 'Sistem WBS',
          timestamp: new Date().toISOString()
        }
      ],
      messages: [],
      aiAnalysis: aiResult ? {
        urgencyScore: aiResult.urgencyScore,
        riskCategory: aiResult.riskCategory,
        keyIndicators: aiResult.keyIndicators || [],
        recommendedAction: aiResult.recommendedAction || '',
        summary: aiResult.summary || ''
      } : undefined
    };

    onReportSubmitted(newReport);
    setSubmittedReport(newReport);
    setGeneratedPin(pin);

    // Auto Dispatch Notification to Inspector's Email & Reporter's Email
    try {
      const resp = await fetch('/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: newReport.ticketCode,
          subject: newReport.subject,
          category: newReport.category,
          location: newReport.location,
          severity: newReport.severity,
          estimatedLossRupiah: newReport.estimatedLossRupiah,
          reporterEmail: reporterEmail && reporterEmail.trim().length > 3 ? reporterEmail.trim() : undefined,
          type: 'NEW_REPORT'
        })
      });
      if (resp.ok) {
        setEmailDispatchStatus({
          inspectorSent: true,
          reporterSent: Boolean(reporterEmail && reporterEmail.trim().length > 3),
          inspectorTarget: inspectorEmail,
          reporterTarget: reporterEmail ? reporterEmail.trim() : undefined
        });
      }
    } catch (e) {
      console.log("Auto notify email triggered", e);
    }
  };

  const handleSimpleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleSubject.trim() || !simpleDescription.trim()) {
      alert("Harap lengkapi judul dan uraian pengaduan.");
      return;
    }
    processReportSubmission(
      simpleSubject,
      simpleDescription,
      simpleCategory as ReportCategory,
      simpleLocation
    );
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Harap lengkapi judul dan deskripsi kejadian.");
      return;
    }
    processReportSubmission(subject, description, category, location);
  };

  const copyTicketDetails = () => {
    if (!submittedReport) return;
    const text = `=== BUKTI TIKET WBS INSPEKTORAT WONDAMA ===\nKode Tiket: ${submittedReport.ticketCode}\nPIN Rahasia: ${generatedPin}\nDigest SHA-256: ${submittedReport.sha256Digest}\nSimpan info ini untuk memantau status pengaduan Anda di portal WBS Inspektorat Kabupaten Teluk Wondama.`;
    navigator.clipboard.writeText(text);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8 text-slate-900">
      {/* Stitch Hero Section */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Lighting */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Layanan Resmi Inspektorat Kabupaten Teluk Wondama
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              100% Rahasia & Terenkripsi
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Formulir Pengaduan Masyarakat (WBS)
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Laporkan dugaan tindak pidana korupsi, pungutan liar, gratifikasi, penyalahgunaan anggaran, atau pelanggaran disiplin ASN di lingkungan Pemerintah Kabupaten Teluk Wondama.
          </p>

          {/* Quick Assurance Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <div className="text-blue-400 font-extrabold text-xs">Proteksi Identitas</div>
              <div className="text-[11px] text-slate-400">Pilihan Anonim Total</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <div className="text-emerald-400 font-extrabold text-xs">Respon Cepat</div>
              <div className="text-[11px] text-slate-400">Verifikasi &lt; 24 Jam</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <div className="text-amber-400 font-extrabold text-xs">Notifikasi Email</div>
              <div className="text-[11px] text-slate-400">Update Tiket Real-Time</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <div className="text-indigo-400 font-extrabold text-xs">Enkripsi AES-256</div>
              <div className="text-[11px] text-slate-400">Bukti Tidak Dapat Disadap</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 pl-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Pilih Metode Pengisian Laporan:</span>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setReportMode('SIMPLE')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'SIMPLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            Mode Cepat (3 Menit Selesai)
          </button>

          <button
            type="button"
            onClick={() => setReportMode('ADVANCED')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'ADVANCED'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Formulir Lengkap (Detail + 2FA)
          </button>
        </div>
      </div>

      {/* Mode 1: SIMPLE QUICK REPORT */}
      {reportMode === 'SIMPLE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Formulir Cepat Tanpa Registrasi</h2>
              <p className="text-xs text-slate-500">Kirim laporan secara anonim dengan 3 isian utama.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Anonim Total
            </span>
          </div>

          <form onSubmit={handleSimpleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Dugaan Pelanggaran: <span className="text-rose-500">*</span>
              </label>
              <select
                value={simpleCategory}
                onChange={(e) => setSimpleCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="KORUPSI_GRATIFIKASI">Korupsi, Pungli, atau Gratifikasi</option>
                <option value="FRAUD_KEUANGAN">Penyimpangan Keuangan / Dana Desa / APBD</option>
                <option value="PENGADAAN_BARANG_JASA">Kecurangan Pengadaan Barang & Jasa (PBJ)</option>
                <option value="PENYALAHGUNAAN_WEWENANG">Penyalahgunaan Wewenang / Jabatan</option>
                <option value="PELECEHAN_SARA">Pelecehan, Diskriminasi, atau SARA</option>
                <option value="PELANGGARAN_KODE_ETIK">Pelanggaran Disiplin & Kode Etik ASN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Ringkas Pengaduan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={simpleSubject}
                onChange={(e) => setSimpleSubject(e.target.value)}
                placeholder="Contoh: Dugaan Pungli Pembuatan Izin di Dinas X..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lokasi / OPD Terkait di Kab. Teluk Wondama:
              </label>
              <input
                type="text"
                value={simpleLocation}
                onChange={(e) => setSimpleLocation(e.target.value)}
                placeholder="Contoh: Kantor Distrik Wasior / Puskesmas Rasiei..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Uraian Kejadian & Kronologi: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={simpleDescription}
                onChange={(e) => setSimpleDescription(e.target.value)}
                placeholder="Jelaskan apa yang terjadi, siapa pihak yang terlibat, waktu kejadian, dan bagaimana pelanggaran terjadi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            {/* Optional Email Notification for Reporter */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Email Anda untuk Notifikasi Progres (Opsional):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com (Boleh dikosongkan jika ingin 100% anonim)"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Jika diisi, tanda terima dan setiap pembaruan investigasi dari Inspektur akan dikirimkan otomatis ke email Anda.
              </p>
            </div>

            {/* AI Risk Evaluation Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Analisis Kualitas Laporan dengan Gemini AI</h4>
                  <p className="text-[11px] text-blue-800">Cek tingkat kelengkapan dan urgensi laporan Anda sebelum dikirim.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAnalyzeWithAi}
                disabled={isAiAnalyzing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {isAiAnalyzing ? 'Menganalisis...' : 'Analisis AI Sekarang'}
              </button>
            </div>

            {/* AI Result Card */}
            {aiResult && (
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Hasil Evaluasi AI Inspektorat</span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Skor Urgensi: {aiResult.urgencyScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{aiResult.summary}</p>
                {aiResult.keyIndicators && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiResult.keyIndicators.map((ind: string, idx: number) => (
                      <span key={idx} className="bg-slate-800 text-blue-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                        {ind}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lampiran Bukti Pendukung (Foto / Dokumen / Rekaman):
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50 transition cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Klik atau seret berkas ke sini</p>
                <p className="text-[11px] text-slate-500">Mendukung PDF, JPG, PNG, DOCX, MP3, MP4</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs font-medium border border-slate-200">
                      <span className="text-slate-800 font-bold truncate max-w-xs">{att.fileName} ({att.fileSize})</span>
                      <span className="text-emerald-700 font-mono text-[10px] font-bold">SHA-256 Verified</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                Kirim Pengaduan Terenkripsi Sekarang
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Mode 2: ADVANCED FORM WITH 2FA */}
      {reportMode === 'ADVANCED' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Formulir Lanjutan & Proteksi Berlapis (2FA)</h2>
              <p className="text-xs text-slate-500">Pilihan identitas rahasia, autentikasi dua faktor, dan rincian kerugian.</p>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Advanced Security
            </span>
          </div>

          <form onSubmit={handleAdvancedSubmit} className="space-y-5">
            {/* Anonymity Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setAnonymity('ANONYMOUS')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  anonymity === 'ANONYMOUS'
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <UserX className={`w-5 h-5 mt-0.5 ${anonymity === 'ANONYMOUS' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Anonim 100%</h4>
                  <p className="text-[11px] text-slate-500">Tidak menyimpan nama atau nomor kontak Anda.</p>
                </div>
              </div>

              <div
                onClick={() => setAnonymity('CONFIDENTIAL_IDENTIFIED')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  anonymity === 'CONFIDENTIAL_IDENTIFIED'
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <UserCheck className={`w-5 h-5 mt-0.5 ${anonymity === 'CONFIDENTIAL_IDENTIFIED' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Identitas Dirahasiakan (Confidential)</h4>
                  <p className="text-[11px] text-slate-500">Data dienkripsi AES-256 khusus untuk Inspektur.</p>
                </div>
              </div>
            </div>

            {/* Confidential Identity Inputs */}
            {anonymity === 'CONFIDENTIAL_IDENTIFIED' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pelapor:</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Lengkap..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / Ponsel:</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Kasus: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="KORUPSI_GRATIFIKASI">Korupsi / Suap / Gratifikasi</option>
                  <option value="FRAUD_KEUANGAN">Fraud / Penggelapan Dana APBD / Desa</option>
                  <option value="PENGADAAN_BARANG_JASA">Pengadaan Barang & Jasa (PBJ)</option>
                  <option value="PENYALAHGUNAAN_WEWENANG">Penyalahgunaan Wewenang</option>
                  <option value="PELECEHAN_SARA">Pelecehan / Diskriminasi / SARA</option>
                  <option value="PELANGGARAN_KODE_ETIK">Pelanggaran Disiplin & Kode Etik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tingkat Urgensi / Keparahan:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="RENDAH">RENDAH - Dampak Minimal</option>
                  <option value="SEDANG">SEDANG - Perlu Verifikasi Cepat</option>
                  <option value="TINGGI">TINGGI - Kerugian Finansial Besar</option>
                  <option value="KRITIS">KRITIS - Ancaman Langsung / Sistemik</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Subjek / Perihal Laporan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Indikasi Mark-Up Proyek Jembatan di Distrik..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi OPD / Distrik:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Dinas PUPR Wondama"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kejadian:</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Kerugian (Rp):</label>
                <input
                  type="number"
                  value={estimatedLoss}
                  onChange={(e) => setEstimatedLoss(e.target.value)}
                  placeholder="Misal: 500000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Uraian Detail Fakta & Kronologi: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uraikan secara runtut kejadian, saksi, barang bukti, dan pihak-pihak terkait..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* 2FA Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Aktifkan Autentikasi Dua Faktor (2FA TOTP)</h4>
                  <p className="text-[11px] text-slate-500">Mencegah tiket Anda diakses oleh pihak lain tanpa aplikasi Google Authenticator.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enable2FA}
                onChange={(e) => setEnable2FA(e.target.checked)}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Send className="w-4 h-4" />
                Kirim Pengaduan Tingkat Lanjut (Enkripsi End-to-End)
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Submission Success Receipt Modal */}
      <AnimatePresence>
        {submittedReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-slate-900"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Pengaduan Berhasil Terkirim!</h3>
                <p className="text-xs text-slate-600">
                  Berkas Anda telah diamankan dengan enkripsi AES-256 dan terdaftar di database Inspektorat Wondama.
                </p>
              </div>

              {/* Secret Ticket & PIN Box */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 font-mono border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                  <span className="text-slate-400">Kode Tiket Rahasia:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{submittedReport.ticketCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">PIN Rahasia Pelapor:</span>
                  <span className="text-amber-300 font-extrabold text-sm tracking-widest">{generatedPin}</span>
                </div>
                {qrCodeUrl && (
                  <div className="pt-2 text-center">
                    <p className="text-[10px] text-slate-400 mb-1">Scan QR Code dengan Google Authenticator (2FA):</p>
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 mx-auto bg-white p-2 rounded-xl" />
                  </div>
                )}
              </div>

              {/* Email Delivery Indicator */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Status Dispatch Notifikasi Email Otomatis:
                </div>
                <div className="pl-6 space-y-1 text-[11px] text-blue-900">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Notifikasi Inspektur Utama: <strong>TERKIRIM KE {inspectorEmail}</strong></span>
                  </p>
                  {submittedReport.reporterEmail ? (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Tanda Terima Pelapor: <strong>TERKIRIM KE {submittedReport.reporterEmail}</strong></span>
                    </p>
                  ) : (
                    <p className="text-slate-500 text-[10px] italic">
                      (Pengaduan anonim tanpa email pelapor. Notifikasi hanya diteruskan ke email Inspektur.)
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowPrintBeritaAcara(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Format Berita Acara Tanda Terima Resmi</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={copyTicketDetails}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition border border-slate-300"
                  >
                    {copiedTicket ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiedTicket ? 'Tersalin!' : 'Salin Kode & PIN'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const code = submittedReport.ticketCode;
                      setSubmittedReport(null);
                      onNavigateToTrack(code, generatedPin);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Pantau Kasus Ini Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CETAK BERITA ACARA RESMI */}
      {showPrintBeritaAcara && submittedReport && (
        <PrintBeritaAcara
          report={submittedReport}
          secretPin={generatedPin}
          onClose={() => setShowPrintBeritaAcara(false)}
        />
      )}
    </div>
  );
};
