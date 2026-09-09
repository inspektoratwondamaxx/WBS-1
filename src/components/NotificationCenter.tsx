import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Mail, 
  Bell, 
  Check, 
  Clock, 
  Shield, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { NotificationItem } from '../types/wbs';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSendTestNotification: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllRead,
  onSendTestNotification
}) => {
  const [activeTab, setActiveTab] = useState<'SMARTPHONE' | 'EMAIL'>('SMARTPHONE');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(notifications[0] || null);

  const mobileNotifs = notifications.filter(n => n.channel === 'MOBILE_PUSH' || n.channel === 'SMS');
  const emailNotifs = notifications.filter(n => n.channel === 'EMAIL');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      {/* Stitch Top Banner */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Smartphone className="w-4 h-4 text-blue-400" />
            Simulator Multi-Channel Whistleblower
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Pusat Notifikasi & Integrasi Perangkat Pelapor
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Simulasi bagaimana pembaruan status dan pesan investigasi Inspektorat Wondama diterima langsung di ponsel pelapor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSendTestNotification}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <Send className="w-3.5 h-3.5" />
            Simulasi Notifikasi Masuk
          </button>

          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Tandai Dibaca
          </button>
        </div>
      </div>

      {/* Segmented View Switcher */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('SMARTPHONE')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'SMARTPHONE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Simulator Ponsel Pelapor (Push & SMS)
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'SMARTPHONE' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
          }`}>
            {mobileNotifs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EMAIL')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'EMAIL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          Inbox Email Terenkripsi Pelapor
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'EMAIL' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
          }`}>
            {emailNotifs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Smartphone Simulator */}
      {activeTab === 'SMARTPHONE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Smartphone Hardware Frame */}
          <div className="bg-slate-900 border-4 border-slate-700 rounded-[42px] p-4 shadow-2xl max-w-sm mx-auto w-full relative">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <span className="w-6 h-1 rounded-full bg-slate-700"></span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="bg-slate-950 rounded-[32px] p-4 text-white min-h-[460px] flex flex-col justify-between space-y-4 border border-slate-800">
              {/* Phone Status Bar */}
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>10:45</span>
                <span className="flex items-center gap-1">
                  <span>5G</span>
                  <span>100%</span>
                </span>
              </div>

              {/* Notification Cards on Lockscreen */}
              <div className="space-y-2.5 flex-1">
                <div className="text-center py-2">
                  <div className="text-3xl font-black font-mono">10:45</div>
                  <div className="text-[11px] text-slate-400">Kamis, Kab. Teluk Wondama</div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {mobileNotifs.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setSelectedNotif(notif)}
                      className="bg-slate-900/90 border border-slate-700 p-3 rounded-2xl shadow-lg cursor-pointer hover:border-blue-500 transition space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-blue-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          WBS Wondama
                        </span>
                        <span className="text-slate-500">{new Date(notif.createdAt).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{notif.body}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Phone Bottom Home Bar */}
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto" />
            </div>
          </div>

          {/* Right Column: Notification Inspector Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Rincian Transmisi Notifikasi</h3>
              <p className="text-xs text-slate-500">Inspeksi parameter data payload yang dikirimkan ke perangkat pelapor.</p>
            </div>

            {selectedNotif ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Notifikasi:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedNotif.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kode Tiket Terkait:</span>
                    <span className="font-mono font-black text-blue-600">{selectedNotif.ticketCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kanal Pengiriman:</span>
                    <span className="font-bold text-slate-800">{selectedNotif.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Read:</span>
                    <span className={`font-bold ${selectedNotif.isRead ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedNotif.isRead ? 'Sudah Dibaca' : 'Belum Dibaca (Unread)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Judul Notifikasi:</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900">
                    {selectedNotif.title}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Isi Pesan Payload:</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                    {selectedNotif.body}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Pilih salah satu notifikasi di simulator untuk melihat detail.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Email Client Reader */}
      {activeTab === 'EMAIL' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Kotak Masuk Surat Elektronik Pelapor
            </h3>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {emailNotifs.length} Pesan
            </span>
          </div>

          <div className="space-y-3">
            {emailNotifs.map((mail) => (
              <div key={mail.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Inspektorat Kabupaten Teluk Wondama &lt;inspektoratwondama@gmail.com&gt;
                  </span>
                  <span className="text-slate-400 text-[11px]">{new Date(mail.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900">{mail.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-medium">
                  {mail.body}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Tiket Ref: <span className="font-bold text-blue-600">{mail.ticketCode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
