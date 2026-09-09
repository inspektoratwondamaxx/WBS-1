import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Shield, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Lock, 
  Sparkles, 
  ExternalLink, 
  Inbox,
  ShieldCheck,
  Building,
  Check,
  Server,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Report } from '../types/wbs';

interface InspectorEmailNotificationsProps {
  reports: Report[];
  inspectorEmail: string;
  setInspectorEmail: (email: string) => void;
  onSendTestEmail: (customTargetEmail?: string) => void;
}

export const InspectorEmailNotifications: React.FC<InspectorEmailNotificationsProps> = ({
  reports,
  inspectorEmail,
  setInspectorEmail,
  onSendTestEmail
}) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(reports[0] || null);
  const [customSubject, setCustomSubject] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [sendingStatus, setSendingStatus] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [testTargetEmail, setTestTargetEmail] = useState('inspektoratwondama@gmail.com');
  const [testSending, setTestSending] = useState(false);

  // Email Notification Log History State from Server Outbox
  const [emailLogs, setEmailLogs] = useState<Array<{
    id: string;
    ticketCode: string;
    recipientType?: string;
    to: string;
    subject: string;
    timestamp: string;
    status: string;
  }>>([]);

  const fetchOutboxLogs = async () => {
    try {
      const res = await fetch('/api/email/outbox');
      if (res.ok) {
        const data = await res.json();
        if (data.outbox) {
          setEmailLogs(data.outbox);
        }
      }
    } catch (e) {
      console.log("Could not fetch outbox logs", e);
    }
  };

  useEffect(() => {
    fetchOutboxLogs();
  }, []);

  const handleTestSendEmail = async () => {
    if (!testTargetEmail) return;
    setTestSending(true);
    try {
      const res = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: testTargetEmail,
          customSubject: '🧪 [UJI COBA RESMI] Tes Sistem Notifikasi Email WBS Inspektorat Teluk Wondama',
          customMessage: 'Sistem pengiriman notifikasi email otomatis WBS Inspektorat Daerah Kabupaten Teluk Wondama telah aktif dan berfungsi normal.'
        })
      });
      if (res.ok) {
        setSendingStatus(`Email Uji Coba Berhasil Terkirim ke ${testTargetEmail}`);
        fetchOutboxLogs();
        setTimeout(() => setSendingStatus(null), 5000);
      }
    } catch (e) {
      setSendingStatus('Gagal mengirim email uji coba.');
    } finally {
      setTestSending(false);
    }
  };

  const handleSendEmailNotification = async () => {
    if (!selectedReport) return;

    setSendingStatus('Mengirim notifikasi email resmi ke server SMTP Inspektorat & Pelapor...');
    try {
      const res = await fetch('/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: selectedReport.ticketCode,
          category: selectedReport.category,
          subject: selectedReport.subject,
          severity: selectedReport.severity,
          reporterType: selectedReport.anonymity === 'ANONYMOUS' ? 'Anonim Rahasia' : 'Teridentifikasi Rahasia',
          inspectorEmail: inspectorEmail,
          reporterEmail: selectedReport.reporterEmail,
          customNote: customNote || 'Dimohon tim Inspektorat segera melakukan pengecekan data di dashboard admin.',
          type: 'NEW_REPORT'
        })
      });

      if (res.ok) {
        setSendingStatus(`Notifikasi Email Resmi Sukses Terkirim untuk Kasus ${selectedReport.ticketCode}!`);
        fetchOutboxLogs();
        setTimeout(() => setSendingStatus(null), 5000);
      }
    } catch (e) {
      setSendingStatus('Gagal memproses pengiriman notifikasi email.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      {/* Stitch Hero Header Card */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Layanan Notifikasi Elektronik
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                SMTP Dispatcher Online
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pusat Notifikasi Email Inspektorat Wondama
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manajemen pengiriman surat pemberitahuan otomatis ke alamat email resmi Inspektorat Wondama dan pelapor saat terdapat pengaduan masuk atau pembaruan status pemeriksaan.
            </p>
          </div>

          {/* Email Recipient Config Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl space-y-3 w-full lg:w-96">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-400" />
                Email Penugasan Inspektur:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
              >
                {isEditingEmail ? 'Simpan' : 'Ubah Email'}
              </button>
            </div>

            {isEditingEmail ? (
              <input
                type="email"
                value={inspectorEmail}
                onChange={(e) => setInspectorEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            ) : (
              <div className="font-mono text-xs font-black text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all">
                {inspectorEmail}
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Setiap laporan baru akan otomatis diteruskan ke kotak masuk ini.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Test Email Dispatch Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Uji Coba Pengiriman Notifikasi Langsung</h3>
              <p className="text-xs text-slate-500">Kirim email simulasi ke alamat email tujuan untuk memastikan koneksi berjalan lancar.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            NodeMailer Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Masukkan alamat email target uji coba (e.g. inspektoratwondama@gmail.com)..."
              value={testTargetEmail}
              onChange={(e) => setTestTargetEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            disabled={testSending}
            onClick={handleTestSendEmail}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {testSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testSending ? 'Mengirim...' : 'Kirim Email Uji Coba'}
          </button>
        </div>

        {/* Quick Test Email Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-bold">Pilih Cepat Target:</span>
          {['inspektoratwondama@gmail.com', 'inspektur.wondama@papuabaratprov.go.id', 'pelapor.wondama@gmail.com'].map((email) => (
            <button
              key={email}
              type="button"
              onClick={() => setTestTargetEmail(email)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer transition"
            >
              {email}
            </button>
          ))}
        </div>

        {sendingStatus && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{sendingStatus}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Email Dispatcher & Live Letterhead Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Select Report & Trigger Dispatch */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Kirim Notifikasi Kasus Tertentu</h3>
            <p className="text-xs text-slate-500">Pilih berkas pengaduan yang ingin diterbitkan surat pemberitahuannya.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Kasus Pengaduan:</label>
              <select
                value={selectedReport?.ticketCode || ''}
                onChange={(e) => {
                  const rep = reports.find(r => r.ticketCode === e.target.value);
                  setSelectedReport(rep || null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              >
                {reports.length === 0 ? (
                  <option value="">Belum ada laporan pengaduan dalam sistem</option>
                ) : (
                  reports.map((r) => (
                    <option key={r.id} value={r.ticketCode}>
                      [{r.ticketCode}] - {r.subject.substring(0, 45)}... ({r.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedReport && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subjek Kasus:</span>
                  <span className="font-bold text-slate-900 max-w-xs truncate">{selectedReport.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori / Lokasi:</span>
                  <span className="font-bold text-slate-900">{selectedReport.category} • {selectedReport.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan Inspektur:</span>
                  <span className="font-mono font-bold text-blue-700">{inspectorEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan Pelapor:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedReport.reporterEmail || 'Tidak diisi (Anonim)'}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Khusus dari Inspektorat (Opsional):</label>
              <textarea
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Tambahkan catatan khusus atau instruksi penanganan untuk tim investigasi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleSendEmailNotification}
              disabled={!selectedReport}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Kirim Notifikasi Kasus Ini ke Email
            </button>
          </div>
        </div>

        {/* Right Column: Official Government Email Letterhead Preview */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Format Surat Elektronik Resmi (Preview)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                HTML Responsive Template
              </span>
            </div>

            {/* Simulated Email Envelope */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner text-xs">
              {/* Email Official Letterhead */}
              <div className="bg-[#0B132B] text-white p-4 border-b-4 border-blue-600 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span className="font-black text-xs tracking-wider">INSPEKTORAT KABUPATEN TELUK WONDAMA</span>
                </div>
                <p className="text-[10px] text-slate-300">Pemberitahuan Sistem Whistleblowing Terpadu</p>
              </div>

              {/* Email Content Body */}
              <div className="p-4 bg-slate-50 space-y-3">
                <p className="font-bold text-slate-800">Yth. Tim Inspektur Daerah / Pelapor,</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Telah terdaftar laporan pengaduan masyarakat baru melalui portal WBS Inspektorat Kabupaten Teluk Wondama dengan rincian berikut:
                </p>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kode Tiket:</span>
                    <span className="font-mono font-black text-blue-600">{selectedReport?.ticketCode || 'WBS-2026-XXXX-XX'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Perihal:</span>
                    <span className="font-bold text-slate-800 truncate max-w-xs">{selectedReport?.subject || 'Dugaan Pelanggaran'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <span className="font-bold text-slate-800">{selectedReport?.category || 'KORUPSI_GRATIFIKASI'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tingkat Urgensi:</span>
                    <span className="font-bold text-amber-600">{selectedReport?.severity || 'SEDANG'}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-900 font-medium">
                  <strong>Pesan:</strong> {customNote || 'Laporan telah diverifikasi secara kriptografis dan siap ditindaklanjuti.'}
                </div>
              </div>

              {/* Email Footer */}
              <div className="bg-slate-100 p-2.5 text-center text-[10px] text-slate-500 border-t border-slate-200">
                Pemerintah Kabupaten Teluk Wondama • Jl. Rasiei, Wasior, Papua Barat
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outbox Delivery Logs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-600" />
              Riwayat Pengiriman Email (Server Outbox Logs)
            </h3>
            <p className="text-xs text-slate-500">Rekam jejak seluruh email pemberitahuan yang telah diproses oleh server WBS.</p>
          </div>

          <button
            type="button"
            onClick={fetchOutboxLogs}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Logs
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white font-black">
              <tr>
                <th className="p-3.5">Waktu Pengiriman</th>
                <th className="p-3.5">Kode Tiket</th>
                <th className="p-3.5">Penerima (To)</th>
                <th className="p-3.5">Subjek Notifikasi</th>
                <th className="p-3.5">Status Pengiriman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                    Belum ada riwayat email keluar pada sesi ini.
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-mono font-black text-blue-600 whitespace-nowrap">
                      {log.ticketCode}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {log.to}
                    </td>
                    <td className="p-3.5 max-w-sm truncate text-slate-700 font-medium">
                      {log.subject}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
