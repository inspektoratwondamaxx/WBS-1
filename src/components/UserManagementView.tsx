import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Shield, 
  Lock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  Filter, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  Sparkles,
  FileSignature,
  LayoutDashboard,
  Eye,
  EyeOff,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/wbs';
import { UserCredential, ROLE_DETAILS } from '../lib/userAccounts';

interface UserManagementViewProps {
  accounts: UserCredential[];
  onAddAccount: (newAcc: UserCredential) => void;
  onUpdateAccount: (updatedAcc: UserCredential) => void;
  onDeleteAccount: (accountId: string) => void;
  onQuickLoginAs?: (user: UserAccount) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onQuickLoginAs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserCredential | null>(null);
  const [resettingPasswordAccount, setResettingPasswordAccount] = useState<UserCredential | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string>('');

  // Add Form State
  const [formData, setFormData] = useState({
    role: 'IRBAN_INVESTIGASI' as UserRole,
    fullName: '',
    nip: '',
    jabatan: '',
    pangkatGolongan: 'Pembina (IV/a)',
    unitKerja: 'Inspektorat Daerah Kabupaten Teluk Wondama',
    email: '',
    phone: '',
    username: '',
    password: '',
    pin: '123456',
    activeStatus: 'AKTIF' as 'AKTIF' | 'NONAKTIF'
  });

  // Reset Password Modal State
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(true);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  // Helper to generate suggestions based on Role
  const handleRoleChange = (selectedRole: UserRole) => {
    if (selectedRole === 'INSPEKTUR') {
      setFormData(prev => ({
        ...prev,
        role: selectedRole,
        jabatan: 'Inspektur Daerah Kabupaten Teluk Wondama',
        pangkatGolongan: 'Pembina Utama Muda (IV/c)',
        unitKerja: 'Inspektorat Daerah Kabupaten Teluk Wondama',
        username: prev.username || 'inspektur.utama',
        password: prev.password || 'Inspektur#2026',
        pin: '123456'
      }));
    } else if (selectedRole === 'IRBAN_INVESTIGASI') {
      setFormData(prev => ({
        ...prev,
        role: selectedRole,
        jabatan: 'Inspektur Pembantu Bidang Investigasi & Khusus',
        pangkatGolongan: 'Pembina Tingkat I (IV/b)',
        unitKerja: 'Inspektorat Pembantu Bidang Investigasi',
        username: prev.username || 'irban.investigasi2',
        password: prev.password || 'Irban#2026',
        pin: '123456'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        role: selectedRole,
        jabatan: 'Administrator & Verifikator Pengaduan WBS',
        pangkatGolongan: 'Penata Tingkat I (III/d)',
        unitKerja: 'Sekretariat Inspektorat Daerah',
        username: prev.username || 'admin.wbs2',
        password: prev.password || 'AdminWbs#2026',
        pin: '123456'
      }));
    }
  };

  // Generate random secure password
  const generateRandomCredentials = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const rolePrefix = formData.role === 'INSPEKTUR' ? 'Insp' : formData.role === 'IRBAN_INVESTIGASI' ? 'Irban' : 'Admin';
    setFormData(prev => ({
      ...prev,
      password: `${rolePrefix}Wondama@${randomSuffix}`,
      pin: `${Math.floor(100000 + Math.random() * 900000)}`
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim() || !formData.password.trim()) {
      alert('Nama Lengkap, Username, dan Password wajib diisi.');
      return;
    }

    // Check duplicate username
    if (accounts.some(a => a.username.toLowerCase() === formData.username.trim().toLowerCase())) {
      alert(`Username "${formData.username}" sudah digunakan oleh akun lain. Gunakan username berbeda.`);
      return;
    }

    const initials = formData.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || 'AP';

    const avatarColor = formData.role === 'INSPEKTUR' 
      ? 'bg-emerald-600' 
      : formData.role === 'IRBAN_INVESTIGASI' 
      ? 'bg-indigo-600' 
      : 'bg-blue-600';

    const permissions = formData.role === 'INSPEKTUR' ? [
      'DISPOSISI_SPRINT',
      'PENERBITAN_SURAT_PERINTAH',
      'CETAK_DOKUMEN_SPRINT',
      'TANDA_TANGAN_DIGITAL_TTE',
      'MONITORING_LHP_INVESTIGASI',
      'PELAPORAN_BUPATI_DAN_APH',
      'VERIFIKASI_AKHIR_KASUS'
    ] : formData.role === 'IRBAN_INVESTIGASI' ? [
      'PENERIMAAN_SURAT_PERINTAH',
      'UPDATE_TAHAPAN_INVESTIGASI',
      'UPLOAD_BUKTI_DAN_BAP',
      'INPUT_PROGRESS_LAPANGAN',
      'SUSUN_LHP_INVESTIGASI',
      'KIRIM_PROGRESS_ADMIN_INSPEKTUR'
    ] : [
      'VERIFIKASI_AWAL_KELAYAKAN',
      'DISPOSISI_KE_INSPEKTUR',
      'MONITORING_SELURUH_KASUS',
      'PUBLIKASI_PROGRES_PELAPOR',
      'MANAGEMENT_AUDIT_TRAIL',
      'CONFIG_NOTIFIKASI_EMAIL_SMS',
      'POSTGRESQL_API_ACCESS',
      'MANAJEMEN_AKUN_PEJABAT'
    ];

    const newAccount: UserCredential = {
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(),
      pin: formData.pin.trim() || '123456',
      role: formData.role,
      user: {
        id: `usr-${formData.role.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        username: formData.username.trim().toLowerCase(),
        role: formData.role,
        fullName: formData.fullName.trim(),
        nip: formData.nip.trim() || '19800101 200501 1 001',
        jabatan: formData.jabatan.trim() || (formData.role === 'INSPEKTUR' ? 'Inspektur Daerah' : 'Irban Investigasi'),
        pangkatGolongan: formData.pangkatGolongan.trim() || 'Pembina (IV/a)',
        unitKerja: formData.unitKerja.trim() || 'Inspektorat Daerah Kab. Teluk Wondama',
        email: formData.email.trim() || `${formData.username.trim().toLowerCase()}@wondamakab.go.id`,
        phone: formData.phone.trim() || '+62 812-4800-0000',
        avatarColor,
        initials,
        permissions,
        activeStatus: formData.activeStatus,
        lastLogin: new Date().toISOString()
      }
    };

    onAddAccount(newAccount);
    setIsAddModalOpen(false);
    showNotification(`Akun ${newAccount.user.fullName} (${newAccount.user.jabatan}) dengan username "${newAccount.username}" berhasil dibuat!`);

    // Reset Form
    setFormData({
      role: 'IRBAN_INVESTIGASI',
      fullName: '',
      nip: '',
      jabatan: '',
      pangkatGolongan: 'Pembina (IV/a)',
      unitKerja: 'Inspektorat Daerah Kabupaten Teluk Wondama',
      email: '',
      phone: '',
      username: '',
      password: '',
      pin: '123456',
      activeStatus: 'AKTIF'
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    onUpdateAccount(editingAccount);
    setEditingAccount(null);
    showNotification(`Data akun "${editingAccount.user.fullName}" berhasil diperbarui.`);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordAccount || !newPassword.trim()) {
      alert('Password baru tidak boleh kosong.');
      return;
    }

    const updated: UserCredential = {
      ...resettingPasswordAccount,
      password: newPassword.trim(),
      pin: newPin.trim() || resettingPasswordAccount.pin
    };

    onUpdateAccount(updated);
    setResettingPasswordAccount(null);
    setNewPassword('');
    setNewPin('');
    showNotification(`Password & PIN untuk akun "${updated.username}" (${updated.user.fullName}) berhasil diperbarui!`);
  };

  const handleToggleStatus = (acc: UserCredential) => {
    const nextStatus = acc.user.activeStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    const updated: UserCredential = {
      ...acc,
      user: {
        ...acc.user,
        activeStatus: nextStatus
      }
    };
    onUpdateAccount(updated);
    showNotification(`Status akun "${acc.user.fullName}" diubah menjadi ${nextStatus}.`);
  };

  const handleCopyCredentials = (acc: UserCredential) => {
    const text = `KREDENSIAL AKUN WBS INSPEKTORAT TELUK WONDAMA\nNama: ${acc.user.fullName}\nJabatan: ${acc.user.jabatan}\nUsername: ${acc.username}\nPassword: ${acc.password}\nPIN Otorisasi: ${acc.pin}\nPortal: https://inspektorat.wondamakab.go.id/wbs`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.user.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = 
      acc.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.user.nip.includes(searchTerm) ||
      acc.user.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'ALL' || acc.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const countInspektur = accounts.filter(a => a.role === 'INSPEKTUR').length;
  const countIrban = accounts.filter(a => a.role === 'IRBAN_INVESTIGASI').length;
  const countAdmin = accounts.filter(a => a.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast('')}
              className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Akun Terdaftar</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black mt-2 text-white">{accounts.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Aparat Pengawas Internal (APIP)</span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">Inspektur Daerah</span>
            <FileSignature className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black mt-2 text-emerald-400">{countInspektur}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Otoritas Sprint & Disposisi</span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400">Irban Investigasi</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-black mt-2 text-indigo-400">{countIrban}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Eksekutor Audit & BAP Kasus</span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-blue-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">Admin & Verifikator</span>
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black mt-2 text-blue-400">{countAdmin}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Verifikasi Kelayakan & Kelola User</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Add User Button */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pejabat, NIP, username, jabatan, email..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Role */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Peran ({accounts.length})</option>
              <option value="INSPEKTUR">Inspektur Daerah ({countInspektur})</option>
              <option value="IRBAN_INVESTIGASI">Irban Investigasi ({countIrban})</option>
              <option value="ADMIN">Admin WBS ({countAdmin})</option>
            </select>
          </div>
        </div>

        {/* Add User Action Button */}
        <button
          type="button"
          onClick={() => {
            handleRoleChange('IRBAN_INVESTIGASI');
            generateRandomCredentials();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Pejabat Baru</span>
        </button>
      </div>

      {/* Account Cards & Table Grid */}
      <div className="space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h4 className="font-bold text-base text-slate-200">Tidak ada akun yang sesuai kriteria</h4>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter peran jabatan.</p>
          </div>
        ) : (
          filteredAccounts.map(acc => {
            const isInspektur = acc.role === 'INSPEKTUR';
            const isIrban = acc.role === 'IRBAN_INVESTIGASI';
            const isAdmin = acc.role === 'ADMIN';
            const isActive = acc.user.activeStatus === 'AKTIF';

            return (
              <div
                key={acc.user.id}
                className={`p-5 rounded-2xl border transition-all bg-slate-900/90 hover:bg-slate-900 ${
                  !isActive
                    ? 'opacity-60 border-slate-800'
                    : isInspektur
                    ? 'border-emerald-500/30 hover:border-emerald-400/80 shadow-sm'
                    : isIrban
                    ? 'border-indigo-500/30 hover:border-indigo-400/80 shadow-sm'
                    : 'border-blue-500/30 hover:border-blue-400/80 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* User Profile Block */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 ${
                      isInspektur ? 'bg-emerald-600' : isIrban ? 'bg-indigo-600' : 'bg-blue-600'
                    }`}>
                      {isInspektur ? <FileSignature className="w-7 h-7" /> : isIrban ? <Users className="w-7 h-7" /> : <LayoutDashboard className="w-7 h-7" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isInspektur 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                            : isIrban 
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}>
                          {isInspektur ? 'Inspektur Daerah' : isIrban ? 'Irban Investigasi' : 'Admin WBS'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {acc.user.pangkatGolongan}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isActive ? '● Aktif' : '○ Nonaktif'}
                        </span>
                      </div>

                      <h3 className="font-black text-base text-white">
                        {acc.user.fullName}
                      </h3>

                      <p className="text-xs text-slate-300">
                        {acc.user.jabatan} • <span className="font-mono text-slate-400">NIP: {acc.user.nip}</span>
                      </p>

                      {/* Credentials Display Pill */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-blue-300">
                          User: <b>{acc.username}</b>
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-amber-300">
                          Password: <b>{acc.password}</b>
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-emerald-300">
                          PIN: <b>{acc.pin}</b>
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs">
                          {acc.user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons Group */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Fast Login / Switch Button */}
                    {onQuickLoginAs && (
                      <button
                        type="button"
                        onClick={() => onQuickLoginAs(acc.user)}
                        title="Login langsung sebagai pejabat ini"
                        className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Login Sebagai</span>
                      </button>
                    )}

                    {/* Copy Credentials */}
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(acc)}
                      title="Salin kredensial login (Username, Password & PIN)"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      {copiedId === acc.user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === acc.user.id ? 'Tersalin!' : 'Salin Kredensial'}</span>
                    </button>

                    {/* Reset Password & PIN */}
                    <button
                      type="button"
                      onClick={() => {
                        setResettingPasswordAccount(acc);
                        setNewPassword(acc.password);
                        setNewPin(acc.pin);
                      }}
                      title="Ubah atau reset password & PIN"
                      className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ubah Password</span>
                    </button>

                    {/* Edit Profile */}
                    <button
                      type="button"
                      onClick={() => setEditingAccount(acc)}
                      title="Edit data profil pejabat"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(acc)}
                      title={isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
                      className={`p-2 rounded-xl transition cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Delete Account (protected for last accounts) */}
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus akun ${acc.user.fullName} (@${acc.username})? Tindakan ini tidak dapat dibatalkan.`)) {
                            onDeleteAccount(acc.user.id);
                            showNotification(`Akun ${acc.user.fullName} telah dihapus.`);
                          }
                        }}
                        title="Hapus akun pejabat"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer border border-rose-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Tambah Akun Pejabat Baru */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0F172A] text-slate-100 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8"
            >
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Buat Akun & Password Pejabat Baru</h3>
                  <p className="text-xs text-slate-400">Tambahkan akun Inspektur Daerah, Irban Investigasi, atau Admin WBS.</p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pilih Peran Jabatan (Role):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('INSPEKTUR')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.role === 'INSPEKTUR'
                          ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-xs block text-emerald-400">1. Inspektur Daerah</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Penerbitan Sprint & LHP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleChange('IRBAN_INVESTIGASI')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.role === 'IRBAN_INVESTIGASI'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-xs block text-indigo-400">2. Irban Investigasi</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Pemeriksaan & BAP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleChange('ADMIN')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.role === 'ADMIN'
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-xs block text-blue-400">3. Admin WBS</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Verifikasi & Pengelolaan</span>
                    </button>
                  </div>
                </div>

                {/* Full Name & NIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nama Lengkap & Gelar:*
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Contoh: Drs. Herman Bonay, M.Si"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      NIP (Nomor Induk Pegawai):*
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="Contoh: 19780512 200312 1 002"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Jabatan & Pangkat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Jabatan Resmi:
                    </label>
                    <input
                      type="text"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      placeholder="Nama jabatan dinas"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pangkat / Golongan Ruang:
                    </label>
                    <select
                      value={formData.pangkatGolongan}
                      onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Pembina Utama Muda (IV/c)">Pembina Utama Muda (IV/c)</option>
                      <option value="Pembina Tingkat I (IV/b)">Pembina Tingkat I (IV/b)</option>
                      <option value="Pembina (IV/a)">Pembina (IV/a)</option>
                      <option value="Penata Tingkat I (III/d)">Penata Tingkat I (III/d)</option>
                      <option value="Penata (III/c)">Penata (III/c)</option>
                      <option value="Penata Muda Tingkat I (III/b)">Penata Muda Tingkat I (III/b)</option>
                    </select>
                  </div>
                </div>

                {/* Username, Password & PIN */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Kredensial Akses Login:
                    </span>
                    <button
                      type="button"
                      onClick={generateRandomCredentials}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Acak
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Username:*
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username.login"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Password:*
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password login..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        PIN Otorisasi (6 Digit):
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        placeholder="123456"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Dinas:
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="pejabat@wondamakab.go.id"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nomor HP / WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+62 812-xxxx-xxxx"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Buat Akun</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Reset Password & PIN */}
      <AnimatePresence>
        {resettingPasswordAccount && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0F172A] text-slate-100 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8"
            >
              <button
                type="button"
                onClick={() => setResettingPasswordAccount(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Ubah Password & PIN</h3>
                  <p className="text-xs text-slate-400 font-mono">@{resettingPasswordAccount.username}</p>
                </div>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="text-slate-400">Pejabat:</p>
                  <p className="font-bold text-white mt-0.5">{resettingPasswordAccount.user.fullName}</p>
                  <p className="text-[11px] text-slate-400">{resettingPasswordAccount.user.jabatan}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Password Baru:*</label>
                    <button
                      type="button"
                      onClick={() => {
                        const random = Math.floor(100 + Math.random() * 900);
                        setNewPassword(`Wondama#${random}`);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                    >
                      Acak Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordText ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">PIN Otorisasi (6 Digit):</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPin(`${Math.floor(100000 + Math.random() * 900000)}`);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                    >
                      Acak PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingPasswordAccount(null)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    Simpan Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Edit Data Profil Pejabat */}
      <AnimatePresence>
        {editingAccount && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0F172A] text-slate-100 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8"
            >
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Edit Data Pejabat</h3>
                  <p className="text-xs text-slate-400 font-mono">@{editingAccount.username}</p>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap & Gelar:</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.user.fullName}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      user: { ...editingAccount.user, fullName: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">NIP:</label>
                    <input
                      type="text"
                      value={editingAccount.user.nip}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        user: { ...editingAccount.user, nip: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Pangkat / Golongan:</label>
                    <input
                      type="text"
                      value={editingAccount.user.pangkatGolongan}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        user: { ...editingAccount.user, pangkatGolongan: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Jabatan Resmi:</label>
                  <input
                    type="text"
                    value={editingAccount.user.jabatan}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      user: { ...editingAccount.user, jabatan: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Email Dinas:</label>
                    <input
                      type="email"
                      value={editingAccount.user.email}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        user: { ...editingAccount.user, email: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">No. HP / WA:</label>
                    <input
                      type="text"
                      value={editingAccount.user.phone || ''}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        user: { ...editingAccount.user, phone: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
