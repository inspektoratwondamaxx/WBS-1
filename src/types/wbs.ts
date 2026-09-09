export type AnonymityType = 'ANONYMOUS' | 'CONFIDENTIAL_IDENTIFIED';

export type UserRole = 'PUBLIC' | 'ADMIN' | 'INSPEKTUR' | 'IRBAN_INVESTIGASI';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  nip: string;
  jabatan: string;
  pangkatGolongan: string;
  unitKerja: string;
  email: string;
  phone: string;
  avatarColor: string;
  initials: string;
  permissions: string[];
  lastLogin?: string;
  activeStatus: 'AKTIF' | 'NONAKTIF';
}

export type ReportStatus = 'BARU' | 'TERVERIFIKASI' | 'INVESTIGASI' | 'TINDAK_LANJUT' | 'SELESAI' | 'DITOLAK';

export type ReportCategory = 
  | 'KORUPSI_GRATIFIKASI' 
  | 'FRAUD_KEUANGAN' 
  | 'PENYALAHGUNAAN_WEWENANG' 
  | 'PELECEHAN_SARA' 
  | 'PELANGGARAN_KODE_ETIK' 
  | 'PENGADAAN_BARANG_JASA' 
  | 'LAINNYA';

export type SeverityLevel = 'TINGGI' | 'SEDANG' | 'RENDAH' | 'KRITIS';

export interface SuratPerintahTeamMember {
  id: string;
  name: string;
  nip: string;
  jabatan: string;
  peranTim: 'PENANGGUNG_JAWAB' | 'PENGENDALI_TEKNIS' | 'KETUA_TIM' | 'ANGGOTA_TIM';
}

export interface SuratPerintah {
  id: string;
  reportTicketCode: string;
  nomorSprint: string; // e.g. "SP.TUGAS/094/ITDA-TW/VIII/2026"
  perihal: string;
  dasarHukum: string[];
  menimbang: string[];
  untuk: string[];
  lokasiPemeriksaan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  pejabatPenandatangan: {
    nama: string;
    nip: string;
    jabatan: string;
    pangkatGolongan: string;
  };
  timPemeriksa: SuratPerintahTeamMember[];
  tanggalTerbit: string;
  status: 'DITERBITKAN' | 'DIPROSES' | 'SELESAI';
  digitalSignatureHash: string;
  qrVerificationUrl?: string;
}

export interface InvestigationStage {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  status: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI';
  completedAt?: string;
  notes?: string;
  actorName?: string;
  publishedToReporter: boolean;
  publishedAt?: string;
}

export interface AdminVerificationDecision {
  isFeasible: boolean; // Layak / Tidak Layak dilanjutkan ke investigasi
  reason: string;
  verifiedBy: string;
  verifiedAt: string;
  recommendedIrban: string;
  priorityScore: number;
  forwardedToInspektur: boolean;
  forwardedAt?: string;
}

export interface ReportAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  encryptedHash: string;
  uploadedAt: string;
}

export interface ReportMessage {
  id: string;
  reportId: string;
  senderRole: 'PELAPOR' | 'INVESTIGATOR' | 'SYSTEM' | 'INSPEKTUR';
  senderName: string;
  messageEncrypted: string;
  createdAt: string;
  isRead: boolean;
}

export interface TimelineEvent {
  id: string;
  reportId: string;
  status: ReportStatus;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
}

export interface Report {
  id: string;
  ticketCode: string; // e.g. WBS-2026-9821-X3
  secretPinHash: string;
  anonymity: AnonymityType;
  reporterNameEncrypted?: string;
  reporterEmail?: string;
  reporterEmailEncrypted?: string;
  reporterPhoneEncrypted?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  category: ReportCategory;
  subject: string;
  descriptionEncrypted: string;
  location: string;
  incidentDate: string;
  estimatedLossRupiah?: number;
  status: ReportStatus;
  severity: SeverityLevel;
  sha256Digest: string; // Integrity verification hash
  assignedInvestigator?: string;
  assignedIrban?: string;
  createdAt: string;
  updatedAt: string;
  attachments: ReportAttachment[];
  timeline: TimelineEvent[];
  messages: ReportMessage[];
  aiAnalysis?: {
    urgencyScore: number;
    riskCategory: string;
    keyIndicators: string[];
    recommendedAction: string;
    summary: string;
  };
  // New features for Inspektur & Irban Investigasi
  adminVerification?: AdminVerificationDecision;
  suratPerintah?: SuratPerintah;
  investigationStages?: InvestigationStage[];
  investigationProgressPercent?: number;
  irbanNotes?: string;
  lastProgressUpdateAt?: string;
}

export interface AuditLog {
  id: string;
  reportTicketCode: string;
  action: string;
  actor: string;
  ipAddress: string;
  timestamp: string;
  details: string;
  hashSignature: string;
}

export interface NotificationItem {
  id: string;
  ticketCode: string;
  channel: 'EMAIL' | 'SMS' | 'MOBILE_PUSH';
  recipient: string;
  title: string;
  body: string;
  timestamp: string;
  status: 'DELIVERED' | 'READ' | 'PENDING';
}

export interface PostgresTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  isEncrypted?: boolean;
  isNullable?: boolean;
  description: string;
}

export interface PostgresTableSchema {
  tableName: string;
  description: string;
  columns: PostgresTableColumn[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  headers: Record<string, string>;
  requestBody?: Record<string, any>;
  responseExample: Record<string, any>;
  secured: boolean;
}
