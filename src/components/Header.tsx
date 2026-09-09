import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Search, 
  LayoutDashboard, 
  Database, 
  Code, 
  Smartphone, 
  Mail, 
  KeyRound, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  HelpCircle, 
  Activity, 
  Menu, 
  ChevronRight, 
  FileSignature, 
  Users, 
  Briefcase,
  User,
  LogOut,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/wbs';
import { ROLE_DETAILS, UserCredential } from '../lib/userAccounts';
import { LoginModal } from './LoginModal';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount | null;
  onLoginUser: (user: UserAccount) => void;
  onLogoutUser: () => void;
  unreadNotifsCount: number;
  pendingInspekturCount?: number;
  activeIrbanCount?: number;
  pendingFollowUpCount?: number;
  accounts?: UserCredential[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginUser,
  onLogoutUser,
  unreadNotifsCount,
  pendingInspekturCount = 0,
  activeIrbanCount = 0,
  pendingFollowUpCount = 0,
  accounts
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isInspektur = currentUser?.role === 'INSPEKTUR';
  const isIrban = currentUser?.role === 'IRBAN_INVESTIGASI';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isLoggedIn = !!currentUser;

  const currentRoleInfo = currentUser ? ROLE_DETAILS[currentUser.role] : ROLE_DETAILS.PUBLIC;

  // Build navigation items based on current active role
  const navItems = [
    { id: 'CREATE_REPORT', label: 'Buat Pengaduan', icon: FileText, roles: ['PUBLIC', 'ADMIN', 'INSPEKTUR', 'IRBAN_INVESTIGASI'] },
    { id: 'TRACK_REPORT', label: 'Pantau Kasus', icon: Search, roles: ['PUBLIC', 'ADMIN', 'INSPEKTUR', 'IRBAN_INVESTIGASI'] },
    { 
      id: 'OFFICIAL_PORTAL', 
      label: 'Portal Masuk Pejabat', 
      icon: KeyRound, 
      roles: ['PUBLIC', 'ADMIN', 'INSPEKTUR', 'IRBAN_INVESTIGASI'], 
      badge: pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined,
      highlight: !isLoggedIn 
    },
    { id: 'INSPEKTUR_VIEW', label: 'Akses Inspektur', icon: FileSignature, roles: ['INSPEKTUR', 'ADMIN', 'IRBAN_INVESTIGASI'], badge: pendingInspekturCount, highlight: isInspektur },
    { id: 'IRBAN_INVESTIGASI_VIEW', label: 'Irban Investigasi', icon: Users, roles: ['IRBAN_INVESTIGASI', 'ADMIN', 'INSPEKTUR'], badge: activeIrbanCount, highlight: isIrban },
    { id: 'ADMIN_DASHBOARD', label: 'Admin WBS', icon: LayoutDashboard, roles: ['ADMIN', 'INSPEKTUR', 'IRBAN_INVESTIGASI'], highlight: isAdmin },
    { id: 'INSPECTOR_NOTIFICATIONS', label: 'Email Log', icon: Mail, roles: ['ADMIN', 'INSPEKTUR'], badge: unreadNotifsCount },
    { id: 'NOTIFICATIONS', label: 'Notifikasi Ponsel', icon: Smartphone, roles: ['ADMIN'] },
    { id: 'POSTGRES_SCHEMA', label: 'PostgreSQL', icon: Database, roles: ['ADMIN'] },
    { id: 'API_DOCS', label: 'API REST', icon: Code, roles: ['ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (!isLoggedIn) {
      return item.roles.includes('PUBLIC');
    }
    return currentUser ? item.roles.includes(currentUser.role) : false;
  });

  return (
    <header className="bg-[#0B132B] text-[#F8FAFC] sticky top-0 z-40 shadow-xl border-b border-slate-800/80 backdrop-blur-lg">
      {/* Top Banner Ribbon - Official Government Header */}
      <div className="bg-[#070D1E] border-b border-slate-800/60 px-4 sm:px-6 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            PEMERINTAH KABUPATEN TELUK WONDAMA
          </div>
          <span className="hidden md:inline-block text-slate-500">•</span>
          <span className="hidden md:inline-block text-slate-300 text-[11px] font-medium">
            Inspektorat Daerah • Sistem Whistleblowing Resmi (WBS)
          </span>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Enkripsi AES-256 & Anonimitas Terjamin</span>
          </div>

          {/* User Account / Role Controller */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full border transition cursor-pointer hover:opacity-90 ${currentRoleInfo.badgeClass}`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${
                  isInspektur ? 'bg-emerald-600' : isIrban ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {currentUser.initials}
                </div>
                <span className="text-[11px] font-extrabold flex items-center gap-1">
                  {currentUser.role === 'INSPEKTUR' ? 'Inspektur Daerah' : 
                   currentUser.role === 'IRBAN_INVESTIGASI' ? 'Irban Investigasi' : 
                   'Admin WBS'}
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </span>
              </button>

              <button
                type="button"
                onClick={onLogoutUser}
                title="Keluar dari akun pengawas"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer shadow-sm flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('OFFICIAL_PORTAL')}
                className="px-3 py-0.5 rounded-full text-[11px] font-bold transition-all bg-gradient-to-r from-emerald-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/20 ring-1 ring-emerald-400/40"
              >
                <KeyRound className="w-3 h-3 text-emerald-200" />
                <span>Masuk Pejabat & Tindak Lanjut</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                title="Buka dialog login cepat"
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
              >
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                <span>Login Cepat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Emblem & Titles */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setActiveTab(isInspektur ? 'INSPEKTUR_VIEW' : isIrban ? 'IRBAN_INVESTIGASI_VIEW' : 'CREATE_REPORT')}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg border transition-all group-hover:scale-105 ${
              isInspektur 
                ? 'bg-gradient-to-br from-emerald-600 to-slate-900 border-emerald-400/30 shadow-emerald-500/20' 
                : isIrban 
                ? 'bg-gradient-to-br from-indigo-600 to-slate-900 border-indigo-400/30 shadow-indigo-500/20' 
                : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border-blue-400/30 shadow-blue-500/20'
            }`}>
              {isInspektur ? <FileSignature className="w-6 h-6 text-emerald-200" /> : 
               isIrban ? <Users className="w-6 h-6 text-indigo-200" /> : 
               <ShieldCheck className="w-6 h-6 text-blue-200" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  WBS INSPEKTORAT WONDAMA
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border font-mono ${
                  isInspektur ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                  isIrban ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                  isAdmin ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                  'bg-slate-500/10 text-slate-300 border-slate-500/30'
                }`}>
                  {isInspektur ? 'AKSES INSPEKTUR' :
                   isIrban ? 'IRBAN INVESTIGASI' :
                   isAdmin ? 'ADMIN WBS' :
                   'PORTAL PUBLIK'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                {currentUser ? (
                  <>
                    <span className="text-slate-200 font-semibold">{currentUser.fullName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{currentUser.jabatan}</span>
                  </>
                ) : (
                  <>
                    <span>Inspektorat Kabupaten Teluk Wondama</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Papua Barat</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Desktop Segmented Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? isInspektur && item.id === 'INSPEKTUR_VIEW'
                        ? 'text-white font-bold bg-emerald-600 shadow-md shadow-emerald-600/30'
                        : isIrban && item.id === 'IRBAN_INVESTIGASI_VIEW'
                        ? 'text-white font-bold bg-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'text-white font-bold bg-blue-600 shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-slate-900' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => setActiveTab('OFFICIAL_PORTAL')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1.5 border-l border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk Pejabat</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Submenu Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-[#070D1E] border-t border-slate-800 px-4 py-3 space-y-1.5 overflow-hidden"
          >
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? isInspektur && item.id === 'INSPEKTUR_VIEW'
                        ? 'bg-emerald-600 text-white font-bold shadow-md'
                        : isIrban && item.id === 'IRBAN_INVESTIGASI_VIEW'
                        ? 'bg-indigo-600 text-white font-bold shadow-md'
                        : 'bg-blue-600 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Akun Aparat Pengawas</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        accounts={accounts}
        onClose={() => setShowLoginModal(false)}
        onOpenOfficialPortal={() => {
          setShowLoginModal(false);
          setActiveTab('OFFICIAL_PORTAL');
        }}
        onLoginSuccess={(user) => {
          onLoginUser(user);
          setShowLoginModal(false);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        currentUser={currentUser}
        accounts={accounts}
        onClose={() => setShowProfileModal(false)}
        onLogout={() => {
          onLogoutUser();
          setShowProfileModal(false);
        }}
        onSwitchUser={(user) => {
          onLoginUser(user);
        }}
      />
    </header>
  );
};
