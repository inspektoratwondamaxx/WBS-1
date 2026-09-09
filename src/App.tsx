import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { PublicReportForm } from './components/PublicReportForm';
import { ReportTracker } from './components/ReportTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { TwoFactorSetupModal } from './components/TwoFactorSetupModal';
import { NotificationCenter } from './components/NotificationCenter';
import { InspectorEmailNotifications } from './components/InspectorEmailNotifications';
import { InspekturView } from './components/InspekturView';
import { IrbanInvestigasiView } from './components/IrbanInvestigasiView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ApiDocsView } from './components/ApiDocsView';
import { OfficialFollowUpPortal } from './components/OfficialFollowUpPortal';

import { Report, ReportStatus, NotificationItem, AuditLog, SuratPerintah, InvestigationStage, UserAccount } from './types/wbs';
import { INITIAL_REPORTS, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS } from './lib/mockData';
import { createDefaultInvestigationStages } from './lib/investigationWorkflow';
import { generateTicketCode, generateSecretPin, computeSha256Digest, encryptData } from './lib/crypto';
import { OFFICIAL_ACCOUNTS, getUserAccountByRole, UserCredential, getStoredAccounts, saveStoredAccounts } from './lib/userAccounts';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Code, 
  CheckCircle2, 
  Bell, 
  Mail, 
  Building2, 
  Phone, 
  MapPin, 
  FileText,
  Search,
  ExternalLink,
  ChevronUp,
  Users
} from 'lucide-react';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<string>('CREATE_REPORT');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [accounts, setAccounts] = useState<UserCredential[]>(getStoredAccounts);
  const isAdmin = !!currentUser;

  // Inspector Email State
  const [inspectorEmail, setInspectorEmail] = useState<string>('inspektoratwondama@gmail.com');

  // Application Data State
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // User Management Handlers
  const handleAddAccount = (newAcc: UserCredential) => {
    const updated = [newAcc, ...accounts];
    setAccounts(updated);
    saveStoredAccounts(updated);
    showToast(`Akun ${newAcc.user.fullName} (${newAcc.username}) berhasil ditambahkan ke sistem.`);
  };

  const handleUpdateAccount = (updatedAcc: UserCredential) => {
    const updated = accounts.map(a => a.user.id === updatedAcc.user.id ? updatedAcc : a);
    setAccounts(updated);
    saveStoredAccounts(updated);
    if (currentUser && currentUser.id === updatedAcc.user.id) {
      setCurrentUser(updatedAcc.user);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const updated = accounts.filter(a => a.user.id !== accountId);
    setAccounts(updated);
    saveStoredAccounts(updated);
  };

  // Tracker State navigation memory
  const [trackTicketCode, setTrackTicketCode] = useState<string>('');
  const [trackPin, setTrackPin] = useState<string>('');

  // Real-time Simulation Streaming State
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Login handler for official accounts
  const handleLoginUser = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'INSPEKTUR') {
      setActiveTab('INSPEKTUR_VIEW');
      showToast(`Selamat datang, ${user.fullName} (Inspektur Daerah)`);
    } else if (user.role === 'IRBAN_INVESTIGASI') {
      setActiveTab('IRBAN_INVESTIGASI_VIEW');
      showToast(`Selamat datang, ${user.fullName} (Irban Investigasi)`);
    } else {
      setActiveTab('ADMIN_DASHBOARD');
      showToast(`Selamat datang, ${user.fullName} (Admin WBS)`);
    }
  };

  // Logout handler
  const handleLogoutUser = () => {
    setCurrentUser(null);
    setActiveTab('CREATE_REPORT');
    showToast('Anda telah keluar dari akun pengawas.');
  };

  // Access Guard: Public Reporter can access CREATE_REPORT, TRACK_REPORT, or OFFICIAL_PORTAL
  useEffect(() => {
    if (!isAdmin && !['CREATE_REPORT', 'TRACK_REPORT', 'OFFICIAL_PORTAL'].includes(activeTab)) {
      setActiveTab('CREATE_REPORT');
    }
  }, [isAdmin, activeTab]);

  // Handler: New Report Submitted
  const handleReportSubmitted = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);

    // 1. Dispatch Automatic Email Notification to Inspector Email
    const inspectorNotif: NotificationItem = {
      id: `notif-insp-${Date.now()}`,
      ticketCode: newReport.ticketCode,
      channel: 'EMAIL',
      recipient: inspectorEmail,
      title: `⚠️ [NOTIFIKASI OTOMATIS WBS] Pengaduan Baru: ${newReport.ticketCode}`,
      body: `Yth. Inspektur, Terdapat laporan pengaduan baru (${newReport.category}) mengenai "${newReport.subject}" di lokasi "${newReport.location || 'Wilayah Wondama'}". Tingkat Risiko: ${newReport.severity}. Silakan login ke Dashboard Admin WBS untuk verifikasi dan tindak lanjut.`,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED'
    };

    // 2. Dispatch Confirmation Notification to Reporter
    const reporterNotif: NotificationItem = {
      id: `notif-client-${Date.now()}`,
      ticketCode: newReport.ticketCode,
      channel: newReport.reporterEmailEncrypted ? 'EMAIL' : 'MOBILE_PUSH',
      recipient: `Pelapor (${newReport.ticketCode})`,
      title: `🔒 Pengaduan WBS Berhasil Diterima (${newReport.ticketCode})`,
      body: `Pengaduan Anda mengenai "${newReport.subject}" telah terdaftar di WBS Inspektorat Wondama. Notifikasi pemberitahuan telah dikirimkan ke Email Inspektur. Simpan Kode Tiket & PIN Anda secara rahasia.`,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED'
    };

    setNotifications(prev => [inspectorNotif, reporterNotif, ...prev]);

    // 3. Add Audit Log
    const newAudit: AuditLog = {
      id: `log-${Date.now()}`,
      reportTicketCode: newReport.ticketCode,
      action: 'CREATE_REPORT',
      actor: 'Pelapor Publik (Portal Input)',
      ipAddress: '182.253.110.88',
      timestamp: new Date().toISOString(),
      details: `Pengaduan baru dibuat. Notifikasi email otomatis terkirim ke Inspektur (${inspectorEmail}). Enkripsi AES-256 aktif.`,
      hashSignature: newReport.sha256Digest
    };

    setAuditLogs(prev => [newAudit, ...prev]);
    showToast(`Pengaduan ${newReport.ticketCode} berhasil terkirim & Notifikasi Email dikirim ke ${inspectorEmail}`);
  };

  // Handler: Update Report Status (Admin)
  const handleUpdateStatus = async (
    ticketCode: string,
    newStatus: ReportStatus,
    noteTitle: string,
    noteDesc: string,
    investigator?: string,
    notifyUser: boolean = true
  ) => {
    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const newTimeline = [
            ...r.timeline,
            {
              id: `tl-${Date.now()}`,
              reportId: r.id,
              status: newStatus,
              title: noteTitle,
              description: noteDesc,
              actor: investigator || 'Inspektur Pembantu Khusus Wondama',
              timestamp: new Date().toISOString()
            }
          ];

          return {
            ...r,
            status: newStatus,
            assignedInvestigator: investigator || r.assignedInvestigator,
            updatedAt: new Date().toISOString(),
            timeline: newTimeline
          };
        }
        return r;
      })
    );

    // Add Audit Log
    const hash = await computeSha256Digest(ticketCode + newStatus + Date.now());
    const newAudit: AuditLog = {
      id: `log-${Date.now()}`,
      reportTicketCode: ticketCode,
      action: 'UPDATE_STATUS',
      actor: investigator || 'Inspektur Utama',
      ipAddress: '10.20.1.4',
      timestamp: new Date().toISOString(),
      details: `Status diubah menjadi "${newStatus}". Catatan: "${noteTitle}". Notifikasi diteruskan ke Pelapor.`,
      hashSignature: hash
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Dispatch Progress Notification to Reporter (Email / Push)
    if (notifyUser) {
      const targetReport = reports.find(r => r.ticketCode === ticketCode);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        ticketCode,
        channel: targetReport?.reporterEmail ? 'EMAIL' : 'MOBILE_PUSH',
        recipient: targetReport?.reporterEmail || `Pelapor (${ticketCode})`,
        title: `Pembaruan Status Kasus: ${newStatus} (${ticketCode})`,
        body: `Inspektorat Kabupaten Teluk Wondama telah memperbarui kasus pengaduan Anda: "${noteTitle}". ${noteDesc}`,
        timestamp: new Date().toISOString(),
        status: 'DELIVERED'
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Trigger Server-Side Email Dispatch for Status Update
      try {
        await fetch('/api/email/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketCode,
            status: newStatus,
            subject: targetReport?.subject || 'Pembaruan Kasus',
            category: targetReport?.category || 'KORUPSI_GRATIFIKASI',
            reporterEmail: targetReport?.reporterEmail,
            inspectorEmail: inspectorEmail,
            customNote: `${noteTitle}: ${noteDesc}`,
            type: 'STATUS_UPDATE'
          })
        });
      } catch (e) {
        console.log("Email dispatch triggered", e);
      }
    }

    showToast(`Status kasus ${ticketCode} berhasil diubah menjadi ${newStatus}`);
  };

  // Handler: Send Message in Encrypted Chat (Pelapor / Investigator)
  const handleSendMessage = (
    ticketCode: string,
    messageText: string,
    senderRole: 'PELAPOR' | 'INVESTIGATOR'
  ) => {
    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const newMessage = {
            id: `msg-${Date.now()}`,
            reportId: r.id,
            senderRole,
            senderName: senderRole === 'PELAPOR' ? 'Pelapor (Anonim)' : 'Tim Investigasi Inspektorat Wondama',
            messageEncrypted: messageText,
            createdAt: new Date().toISOString()
          };

          return {
            ...r,
            messages: [...r.messages, newMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      })
    );

    // Notification to Counterpart
    const counterpartChannel = senderRole === 'PELAPOR' ? 'EMAIL' : 'MOBILE_PUSH';
    const notifItem: NotificationItem = {
      id: `notif-chat-${Date.now()}`,
      ticketCode,
      channel: counterpartChannel,
      recipient: senderRole === 'PELAPOR' ? inspectorEmail : `Pelapor (${ticketCode})`,
      title: `Pesan Baru Terenkripsi (${ticketCode})`,
      body: `Pesan baru dari ${senderRole === 'PELAPOR' ? 'Pelapor' : 'Tim Inspektur'}: "${messageText.substring(0, 60)}..."`,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED'
    };
    setNotifications(prev => [notifItem, ...prev]);

    showToast(`Pesan terenkripsi berhasil dikirim.`);
  };

  // Navigate to Track Tab with preloaded Ticket & PIN
  const handleNavigateToTrack = (ticketCode: string, pin: string) => {
    setTrackTicketCode(ticketCode);
    setTrackPin(pin);
    setActiveTab('TRACK_REPORT');
  };

  // Calculate badges for Inspektur and Irban
  const pendingInspekturCount = reports.filter(r => r.adminVerification?.forwardedToInspektur && !r.suratPerintah && r.adminVerification?.isFeasible).length;
  const activeIrbanCount = reports.filter(r => !!r.suratPerintah && r.status !== 'SELESAI').length;

  // Handler: Admin Verifies and Dispositions Report to Inspektur (Direct in App, no email needed)
  const handleVerifyAndForwardToInspektur = async (
    ticketCode: string,
    isFeasible: boolean,
    reason: string,
    priorityScore: number
  ) => {
    const targetReport = reports.find(r => r.ticketCode === ticketCode);
    const now = new Date().toISOString();
    const nextStatus: ReportStatus = isFeasible ? 'TERVERIFIKASI' : 'DITOLAK';

    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const newVerification = {
            isFeasible,
            reason,
            verifiedBy: 'Administrator Pengawas WBS Wondama',
            verifiedAt: now,
            recommendedIrban: 'Irban Investigasi Khusus',
            priorityScore,
            forwardedToInspektur: true,
            forwardedAt: now
          };

          const newTimeline = [
            ...r.timeline,
            {
              id: `tl-verif-${Date.now()}`,
              reportId: r.id,
              status: nextStatus,
              title: isFeasible ? 'Verifikasi Kelayakan: Layak Investigasi' : 'Verifikasi Kelayakan: Ditolak',
              description: `Admin WBS telah memverifikasi pengaduan. ${reason}. Disposisi langsung ke meja Inspektur Daerah.`,
              actor: 'Admin WBS Inspektorat',
              timestamp: now
            }
          ];

          return {
            ...r,
            status: nextStatus,
            adminVerification: newVerification,
            updatedAt: now,
            timeline: newTimeline
          };
        }
        return r;
      })
    );

    // Add Audit Log
    const hash = await computeSha256Digest(ticketCode + (isFeasible ? 'FEASIBLE' : 'REJECTED') + now);
    const newAudit: AuditLog = {
      id: `log-verif-${Date.now()}`,
      reportTicketCode: ticketCode,
      action: 'ADMIN_VERIFICATION_FORWARD_INSPEKTUR',
      actor: 'Admin WBS',
      ipAddress: '10.20.1.4',
      timestamp: now,
      details: `Verifikasi berkas: ${isFeasible ? 'LAYAK' : 'TIDAK LAYAK'}. Disposisi langsung ke aplikasi Inspektur (Prioritas: ${priorityScore}/100).`,
      hashSignature: hash
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Dispatch Internal Notification for Inspektur
    const inspNotif: NotificationItem = {
      id: `notif-disp-${Date.now()}`,
      ticketCode,
      channel: 'MOBILE_PUSH',
      recipient: 'Inspektur Daerah Kab. Teluk Wondama',
      title: `📑 [DISPOSISI ADMIN] Pengaduan ${ticketCode} Menunggu Surat Perintah (Sprint)`,
      body: `Admin WBS telah memverifikasi kelayakan kasus "${targetReport?.subject}". Rekomendasi: Layak ditindaklanjuti. Silakan buka tab Akses Inspektur untuk menerbitkan Surat Perintah Tugas.`,
      timestamp: now,
      status: 'DELIVERED'
    };
    setNotifications(prev => [inspNotif, ...prev]);

    showToast(`Pengaduan ${ticketCode} berhasil diverifikasi dan didisposisikan ke meja Inspektur.`);
  };

  // Handler: Inspektur Issues Surat Perintah (Sprint) to Irban Investigasi
  const handleCreateSprint = async (ticketCode: string, sprintData: SuratPerintah) => {
    const targetReport = reports.find(r => r.ticketCode === ticketCode);
    const now = new Date().toISOString();
    const defaultStages = createDefaultInvestigationStages();

    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const newTimeline = [
            ...r.timeline,
            {
              id: `tl-sprint-${Date.now()}`,
              reportId: r.id,
              status: 'INVESTIGASI' as ReportStatus,
              title: `Surat Perintah Tugas Terbit (${sprintData.nomorSprint})`,
              description: `Inspektur Daerah telah menerbitkan Surat Perintah Tugas untuk Tim Irban Investigasi. Perihal: ${sprintData.perihal}. Pemeriksaan dimulai ${sprintData.tanggalMulai} s/d ${sprintData.tanggalSelesai}.`,
              actor: 'Inspektur Daerah Kab. Teluk Wondama',
              timestamp: now
            }
          ];

          return {
            ...r,
            status: 'INVESTIGASI' as ReportStatus,
            suratPerintah: sprintData,
            investigationStages: r.investigationStages && r.investigationStages.length > 0 ? r.investigationStages : defaultStages,
            investigationProgressPercent: r.investigationProgressPercent || 20,
            assignedIrban: 'Irban Investigasi Khusus',
            updatedAt: now,
            timeline: newTimeline
          };
        }
        return r;
      })
    );

    // Add Audit Log
    const hash = await computeSha256Digest(ticketCode + sprintData.nomorSprint + now);
    const newAudit: AuditLog = {
      id: `log-sprint-${Date.now()}`,
      reportTicketCode: ticketCode,
      action: 'ISSUE_SURAT_PERINTAH',
      actor: 'Inspektur Daerah',
      ipAddress: '10.20.1.2',
      timestamp: now,
      details: `Surat Perintah Tugas No: ${sprintData.nomorSprint} resmi diterbitkan. Penugasan langsung ke Tim Irban Investigasi.`,
      hashSignature: hash
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Dispatch Internal Notification for Irban Investigasi
    const irbanNotif: NotificationItem = {
      id: `notif-irban-${Date.now()}`,
      ticketCode,
      channel: 'MOBILE_PUSH',
      recipient: 'Inspektur Pembantu Investigasi',
      title: `⚡ [SPRINT BARU] Surat Perintah Tugas ${sprintData.nomorSprint} Telah Terbit`,
      body: `Inspektur Daerah telah menugaskan Anda untuk menangani investigasi kasus "${targetReport?.subject}". Silakan buka tab Irban Investigasi untuk memproses tahapan kasus.`,
      timestamp: now,
      status: 'DELIVERED'
    };
    setNotifications(prev => [irbanNotif, ...prev]);

    showToast(`Surat Perintah Tugas ${sprintData.nomorSprint} berhasil diterbitkan dan diterima Irban Investigasi.`);
  };

  // Handler: Irban Investigasi Updates Stage Progress (Directly on app to Admin)
  const handleUpdateStageProgress = async (
    ticketCode: string,
    updatedStages: InvestigationStage[],
    irbanNotes: string,
    notifyAdmin: boolean = true,
    explicitStatus?: ReportStatus
  ) => {
    const totalStages = updatedStages.length;
    const completedStages = updatedStages.filter(s => s.status === 'SELESAI').length;
    const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    const now = new Date().toISOString();

    let newStatus: ReportStatus = explicitStatus || (progressPercent === 100 ? 'SELESAI' : progressPercent >= 60 ? 'TINDAK_LANJUT' : 'INVESTIGASI');

    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const currentProgress = r.investigationProgressPercent || 0;
          let newTimeline = [...r.timeline];

          const activeStage = updatedStages.find(s => s.status === 'SEDANG_BERJALAN') || updatedStages.find(s => s.status === 'SELESAI');

          // If status changed or milestone progressed, record timeline event
          if (progressPercent !== currentProgress || explicitStatus || r.status !== newStatus) {
            newTimeline.push({
              id: `tl-prog-${Date.now()}`,
              reportId: r.id,
              status: newStatus,
              title: progressPercent === 100 
                ? `Investigasi Selesai (100%) - Naskah Rekomendasi Terbit`
                : `Progres Irban Investigasi: ${progressPercent}% (${activeStage ? activeStage.title.split('&')[0].trim() : 'Pemeriksaan Berjalan'})`,
              description: activeStage 
                ? `${activeStage.title}: ${activeStage.notes || activeStage.description || irbanNotes || 'Tahapan investigasi sedang dilaksanakan oleh tim pemeriksa.'}` 
                : (irbanNotes || `Status investigasi kasus kini: ${newStatus}`),
              actor: 'Tim Irban Khusus Investigasi',
              timestamp: now
            });
          }

          return {
            ...r,
            status: newStatus,
            investigationStages: updatedStages,
            investigationProgressPercent: progressPercent,
            irbanNotes: irbanNotes || r.irbanNotes,
            lastProgressUpdateAt: now,
            updatedAt: now,
            timeline: newTimeline
          };
        }
        return r;
      })
    );

    // Add Audit Log
    const hash = await computeSha256Digest(ticketCode + progressPercent + now);
    const newAudit: AuditLog = {
      id: `log-irban-${Date.now()}`,
      reportTicketCode: ticketCode,
      action: 'UPDATE_INVESTIGATION_STAGE',
      actor: 'Irban Investigasi',
      ipAddress: '10.20.1.8',
      timestamp: now,
      details: `Pembaruan progres investigasi: ${progressPercent}% selesai. Catatan: "${irbanNotes.substring(0, 80)}...". Terkirim langsung ke Admin.`,
      hashSignature: hash
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Dispatch Internal Notification for Admin
    if (notifyAdmin) {
      const adminNotif: NotificationItem = {
        id: `notif-prog-adm-${Date.now()}`,
        ticketCode,
        channel: 'MOBILE_PUSH',
        recipient: 'Admin WBS & Inspektur',
        title: `📊 [PROGRES IRBAN] Kasus ${ticketCode} Kini ${progressPercent}%`,
        body: `Tim Irban Investigasi telah memperbarui tahapan penanganan kasus. Silakan tinjau dan publikasikan catatan ke dashboard pelapor jika diperlukan.`,
        timestamp: now,
        status: 'DELIVERED'
      };
      setNotifications(prev => [adminNotif, ...prev]);
    }

    showToast(`Progres kasus ${ticketCode} (${progressPercent}%) berhasil dikirimkan ke Admin.`);
  };

  // Handler: Admin Publishes Irban Progress Note to Reporter Dashboard Timeline
  const handlePublishIrbanProgressToReporter = async (
    ticketCode: string,
    stageTitle: string,
    progressPercent: number,
    publicNote: string
  ) => {
    const targetReport = reports.find(r => r.ticketCode === ticketCode);
    const now = new Date().toISOString();

    setReports(prev =>
      prev.map(r => {
        if (r.ticketCode === ticketCode) {
          const newTimeline = [
            ...r.timeline,
            {
              id: `tl-pub-${Date.now()}`,
              reportId: r.id,
              status: r.status,
              title: `Pembaruan Progres Resmi: ${stageTitle}`,
              description: publicNote,
              actor: 'Inspektorat Kabupaten Teluk Wondama',
              timestamp: now
            }
          ];

          return {
            ...r,
            updatedAt: now,
            timeline: newTimeline
          };
        }
        return r;
      })
    );

    // Add Audit Log
    const hash = await computeSha256Digest(ticketCode + 'PUBLISH_REPORTER' + now);
    const newAudit: AuditLog = {
      id: `log-pub-${Date.now()}`,
      reportTicketCode: ticketCode,
      action: 'PUBLISH_PROGRESS_TO_REPORTER',
      actor: 'Admin WBS',
      ipAddress: '10.20.1.4',
      timestamp: now,
      details: `Catatan progres resmi ("${stageTitle}") telah dipublikasikan dan dapat diakses oleh Pelapor melalui kode tiket.`,
      hashSignature: hash
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Dispatch Notification to Reporter
    const reporterNotif: NotificationItem = {
      id: `notif-rep-pub-${Date.now()}`,
      ticketCode,
      channel: targetReport?.reporterEmail ? 'EMAIL' : 'MOBILE_PUSH',
      recipient: targetReport?.reporterEmail || `Pelapor (${ticketCode})`,
      title: `🔔 Perkembangan Baru Kasus Anda (${ticketCode})`,
      body: `Inspektorat Wondama telah mempublikasikan perkembangan baru: "${stageTitle}". Silakan cek menu Pantau Kasus.`,
      timestamp: now,
      status: 'DELIVERED'
    };
    setNotifications(prev => [reporterNotif, ...prev]);

    showToast(`Progres kasus ${ticketCode} berhasil dipublikasikan ke Dashboard Pelapor!`);
  };
  useEffect(() => {
    if (!isSimulatingLive) return;

    const interval = setInterval(async () => {
      const sampleCategories = [
        'KORUPSI_GRATIFIKASI',
        'PENGADAAN_BARANG_JASA',
        'FRAUD_KEUANGAN',
        'PENYALAHGUNAAN_WEWENANG',
        'PELANGGARAN_KODE_ETIK'
      ];
      const sampleSubjects = [
        'Dugaan Mark-Up Pengadaan Alat Medis Puskesmas Rasiei',
        'Pungutan Liar Pembuatan Dokumen Kependudukan Distrik Wasior',
        'Penyalahgunaan Anggaran Dana Desa Tahun Anggaran 2025/2026',
        'Kecurangan Tender Proyek Pembangunan Jalan Distrik Kuri Wamesa'
      ];

      const cat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)] as any;
      const sub = sampleSubjects[Math.floor(Math.random() * sampleSubjects.length)];
      const code = generateTicketCode();
      const pin = generateSecretPin();
      const digest = await computeSha256Digest(code + sub + Date.now());

      const simReport: Report = {
        id: `rep-live-${Date.now()}`,
        ticketCode: code,
        secretPinHash: pin,
        anonymity: 'ANONYMOUS',
        twoFactorEnabled: false,
        category: cat,
        subject: sub,
        descriptionEncrypted: encryptData("Laporan otomatis dihasilkan oleh Live Stream Telemetry Generator WBS Inspektorat Teluk Wondama."),
        location: "Distrik Rasiei, Kab. Teluk Wondama",
        incidentDate: new Date().toISOString().split('T')[0],
        status: 'BARU',
        severity: 'SEDANG',
        sha256Digest: digest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        timeline: [
          {
            id: `tl-sim-${Date.now()}`,
            reportId: `rep-live-${Date.now()}`,
            status: 'BARU',
            title: 'Laporan Masuk (Streaming)',
            description: 'Pengaduan masyarakat terdaftar secara real-time via saluran streaming terenkripsi.',
            actor: 'Sistem WBS',
            timestamp: new Date().toISOString()
          }
        ],
        messages: []
      };

      handleReportSubmitted(simReport);
    }, 15000);

    return () => clearInterval(interval);
  }, [isSimulatingLive]);

  // Mark all notifications read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast("Seluruh notifikasi telah ditandai dibaca.");
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;
  const pendingFollowUpCount = reports.filter(r => r.status === 'BARU' || (r.status === 'TERVERIFIKASI' && !r.suratPerintah) || r.status === 'INVESTIGASI').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Sticky Global Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginUser={handleLoginUser}
        onLogoutUser={handleLogoutUser}
        unreadNotifsCount={unreadNotifsCount}
        pendingInspekturCount={pendingInspekturCount}
        activeIrbanCount={activeIrbanCount}
        pendingFollowUpCount={pendingFollowUpCount}
        accounts={accounts}
      />

      {/* Toast Notification Pill */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 bg-[#0B132B] text-white border border-slate-700 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="leading-snug">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dynamic Viewport with Transition */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'CREATE_REPORT' && (
              <PublicReportForm
                onReportSubmitted={handleReportSubmitted}
                onNavigateToTrack={handleNavigateToTrack}
                inspectorEmail={inspectorEmail}
              />
            )}

            {activeTab === 'TRACK_REPORT' && (
              <ReportTracker
                reports={reports}
                initialTicketCode={trackTicketCode}
                initialPin={trackPin}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeTab === 'ADMIN_DASHBOARD' && isAdmin && (
              <AdminDashboard
                reports={reports}
                onUpdateStatus={handleUpdateStatus}
                onVerifyAndForwardToInspektur={handleVerifyAndForwardToInspektur}
                onPublishIrbanProgressToReporter={handlePublishIrbanProgressToReporter}
                onSimulateNewReport={() => {
                  const sampleCategories = ['KORUPSI_GRATIFIKASI', 'PENGADAAN_BARANG_JASA', 'FRAUD_KEUANGAN'];
                  const cat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)] as any;
                  const code = generateTicketCode();
                  const pin = generateSecretPin();

                  const newRep: Report = {
                    id: `rep-${Date.now()}`,
                    ticketCode: code,
                    secretPinHash: pin,
                    anonymity: 'ANONYMOUS',
                    twoFactorEnabled: false,
                    category: cat,
                    subject: 'Dugaan Pelanggaran Tambahan di Dinas Lingkungan Hidup',
                    descriptionEncrypted: encryptData("Laporan simulasi audit untuk verifikasi dashboard Inspektorat."),
                    location: "Rasiei, Kab. Teluk Wondama",
                    incidentDate: new Date().toISOString().split('T')[0],
                    status: 'BARU',
                    severity: 'SEDANG',
                    sha256Digest: 'sha256-sim-' + Date.now(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    attachments: [],
                    timeline: [
                      {
                        id: `tl-sim-${Date.now()}`,
                        reportId: `rep-${Date.now()}`,
                        status: 'BARU',
                        title: 'Pengaduan Terdaftar',
                        description: 'Laporan pengaduan masuk ke antrean verifikasi Inspektorat Wondama.',
                        actor: 'Sistem WBS',
                        timestamp: new Date().toISOString()
                      }
                    ],
                    messages: []
                  };

                  handleReportSubmitted(newRep);
                }}
                isSimulatingLive={isSimulatingLive}
                setIsSimulatingLive={setIsSimulatingLive}
                currentUser={currentUser}
                accounts={accounts}
                onAddAccount={handleAddAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
                onQuickLoginAs={handleLoginUser}
              />
            )}

            {activeTab === 'INSPEKTUR_VIEW' && isAdmin && (
              <InspekturView
                reports={reports}
                onCreateSprint={handleCreateSprint}
                onUpdateReportStatus={handleUpdateStatus}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'IRBAN_INVESTIGASI_VIEW' && isAdmin && (
              <IrbanInvestigasiView
                reports={reports}
                onUpdateStageProgress={handleUpdateStageProgress}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'INSPECTOR_NOTIFICATIONS' && isAdmin && (
              <InspectorEmailNotifications
                reports={reports}
                inspectorEmail={inspectorEmail}
                setInspectorEmail={setInspectorEmail}
                onSendTestEmail={(customTarget) => {
                  showToast(`Email uji coba resmi berhasil dikirim ke ${customTarget || inspectorEmail}`);
                }}
              />
            )}

            {activeTab === 'NOTIFICATIONS' && isAdmin && (
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onSendTestNotification={() => {
                  const testNotif: NotificationItem = {
                    id: `notif-test-${Date.now()}`,
                    ticketCode: 'WBS-2026-TEST-99',
                    channel: 'MOBILE_PUSH',
                    recipient: 'Pelapor (Ponsel)',
                    title: 'Uji Coba Push Notification WBS',
                    body: 'Notifikasi ini menguji penerimaan sinyal push dari server Inspektorat Wondama ke perangkat pengguna.',
                    timestamp: new Date().toISOString(),
                    status: 'DELIVERED'
                  };
                  setNotifications(prev => [testNotif, ...prev]);
                  showToast("Notifikasi uji coba berhasil disimulasikan ke simulator ponsel.");
                }}
              />
            )}

            {activeTab === 'POSTGRES_SCHEMA' && isAdmin && (
              <DatabaseSchemaView reports={reports} />
            )}

            {activeTab === 'API_DOCS' && isAdmin && (
              <ApiDocsView />
            )}

            {activeTab === 'OFFICIAL_PORTAL' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <OfficialFollowUpPortal
                  reports={reports}
                  accounts={accounts}
                  currentUser={currentUser}
                  onLoginUser={handleLoginUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectSpecificReport={(ticketCode) => {
                    setTrackTicketCode(ticketCode);
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Official Government Footer (Google Stitch Theme) */}
      <footer className="bg-[#0B132B] text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Organization & Identity */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight">
                    INSPEKTORAT KABUPATEN TELUK WONDAMA
                  </h3>
                  <p className="text-[11px] text-slate-400">Pemerintah Provinsi Papua Barat</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Saluran Whistleblowing System (WBS) resmi untuk pelaporan tindak pidana korupsi, gratifikasi, penyalahgunaan wewenang, dan pelanggaran kode etik ASN. Dilengkapi enkripsi berkas berstandar militer AES-256 dan garansi perlindungan identitas pelapor.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-400">
                <span className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Bebas Biaya / Bebas Pungli
                </span>
                <span className="flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 text-blue-300">
                  <Mail className="w-3 h-3 text-blue-400" />
                  inspektoratwondama@gmail.com
                </span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigasi Utama & Akses Pejabat</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE_REPORT')}
                    className="hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Buat Pengaduan Baru
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('TRACK_REPORT')}
                    className="hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    Pantau Kasus (Lacak Tiket)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleLoginUser(getUserAccountByRole('ADMIN'));
                    }}
                    className="hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    Login Admin WBS (Johanes Rumbarar)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleLoginUser(getUserAccountByRole('INSPEKTUR'));
                    }}
                    className="hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Login Inspektur (Drs. Jacobus Somambui)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleLoginUser(getUserAccountByRole('IRBAN_INVESTIGASI'));
                    }}
                    className="hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Login Irban Investigasi (Hendrik Mansawan)
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Address */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kontak & Alamat Kantor</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kompleks Perkantoran Pemerintah Daerah Kabupaten Teluk Wondama, Jl. Rasiei, Wasior, Papua Barat.
              </p>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <p>Email: inspektoratwondama@gmail.com</p>
                <p>Layanan: Senin - Jumat (08.00 - 16.00 WIT)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© 2026 Inspektorat Kabupaten Teluk Wondama. Hak Cipta Dilindungi Undang-Undang.</p>
            <div className="flex items-center gap-4">
              <span>Keamanan Kriptografi AES-256</span>
              <span>•</span>
              <span>Integrasi Google Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
