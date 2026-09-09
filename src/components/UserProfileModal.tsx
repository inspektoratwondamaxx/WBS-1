import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  X, 
  LogOut, 
  RefreshCw, 
  Award, 
  Building2, 
  Mail, 
  Phone, 
  Key, 
  CheckCircle2,
  FileSignature,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { UserAccount } from '../types/wbs';
import { UserCredential, getStoredAccounts, ROLE_DETAILS } from '../lib/userAccounts';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  onClose: () => void;
  onLogout: () => void;
  onSwitchUser: (newUser: UserAccount) => void;
  accounts?: UserCredential[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLogout,
  onSwitchUser,
  accounts
}) => {
  if (!isOpen || !currentUser) return null;

  const accountList = accounts || getStoredAccounts();
  const roleInfo = ROLE_DETAILS[currentUser.role] || ROLE_DETAILS.ADMIN;
  const isInspektur = currentUser.role === 'INSPEKTUR';
  const isIrban = currentUser.role === 'IRBAN_INVESTIGASI';
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0F172A] text-slate-100 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative my-8 space-y-5"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20 ${
            isInspektur ? 'bg-emerald-600 shadow-emerald-500/20' : isIrban ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'
          }`}>
            {isInspektur ? <FileSignature className="w-8 h-8" /> : isIrban ? <Users className="w-8 h-8" /> : <LayoutDashboard className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${roleInfo.badgeClass}`}>
                {roleInfo.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {currentUser.pangkatGolongan}
              </span>
            </div>
            <h3 className="font-black text-lg text-white mt-1">
              {currentUser.fullName}
            </h3>
            <p className="text-xs text-slate-400">
              {currentUser.jabatan}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">Nomor Induk Pegawai (NIP):</span>
            <span className="font-mono font-bold text-white mt-0.5 block">{currentUser.nip}</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">Unit Kerja:</span>
            <span className="font-semibold text-white mt-0.5 block truncate">{currentUser.unitKerja}</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">Email Dinas:</span>
            <span className="font-semibold text-slate-200 mt-0.5 block truncate">{currentUser.email}</span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">Username Aplikasi:</span>
            <span className="font-mono font-bold text-blue-400 mt-0.5 block">@{currentUser.username}</span>
          </div>
        </div>

        {/* Granted Permissions List */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Otoritas & Hak Akses Resmi:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {currentUser.permissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{perm.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Switch Account Quick Section */}
        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Ganti Akun Pengawas Lainnya:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {accountList.map(acc => {
              const isCurrent = acc.user.id === currentUser.id;
              return (
                <button
                  key={acc.user.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    onSwitchUser(acc.user);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500/50 text-white cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      acc.role === 'INSPEKTUR' ? 'bg-emerald-500/20 text-emerald-300' :
                      acc.role === 'IRBAN_INVESTIGASI' ? 'bg-indigo-500/20 text-indigo-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {acc.role === 'INSPEKTUR' ? 'Inspektur' : acc.role === 'IRBAN_INVESTIGASI' ? 'Irban Investigasi' : 'Admin WBS'}
                    </span>
                    <p className="text-xs font-bold text-white mt-1 truncate">{acc.user.fullName.split(',')[0]}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">@{acc.username}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar Akun (Logout)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
