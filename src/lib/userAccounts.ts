import { UserAccount, UserRole } from '../types/wbs';

export interface UserCredential {
  username: string;
  pin: string;
  password: string;
  role: UserRole;
  user: UserAccount;
}

export const INITIAL_OFFICIAL_ACCOUNTS: UserCredential[] = [
  {
    username: 'inspektur',
    pin: '123456',
    password: 'inspektur123',
    role: 'INSPEKTUR',
    user: {
      id: 'usr-inspektur-01',
      username: 'inspektur',
      role: 'INSPEKTUR',
      fullName: 'Drs. Jacobus Somambui, M.Si',
      nip: '19720415 199803 1 005',
      jabatan: 'Inspektur Daerah Kabupaten Teluk Wondama',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      unitKerja: 'Inspektorat Daerah Kabupaten Teluk Wondama',
      email: 'inspektur@wondamakab.go.id',
      phone: '+62 811-4850-9901',
      avatarColor: 'bg-emerald-600',
      initials: 'JS',
      permissions: [
        'DISPOSISI_SPRINT',
        'PENERBITAN_SURAT_PERINTAH',
        'CETAK_DOKUMEN_SPRINT',
        'TANDA_TANGAN_DIGITAL_TTE',
        'MONITORING_LHP_INVESTIGASI',
        'PELAPORAN_BUPATI_DAN_APH',
        'VERIFIKASI_AKHIR_KASUS'
      ],
      activeStatus: 'AKTIF',
      lastLogin: new Date().toISOString()
    }
  },
  {
    username: 'irban.investigasi',
    pin: '123456',
    password: 'irban123',
    role: 'IRBAN_INVESTIGASI',
    user: {
      id: 'usr-irban-01',
      username: 'irban.investigasi',
      role: 'IRBAN_INVESTIGASI',
      fullName: 'Hendrik Mansawan, S.E., M.Ak, CGCAE',
      nip: '19800812 200501 1 008',
      jabatan: 'Inspektur Pembantu Bidang Investigasi & Khusus',
      pangkatGolongan: 'Pembina Tingkat I (IV/b)',
      unitKerja: 'Inspektorat Pembantu Bidang Investigasi (Irban Khusus)',
      email: 'irban.investigasi@wondamakab.go.id',
      phone: '+62 812-4877-2204',
      avatarColor: 'bg-indigo-600',
      initials: 'HM',
      permissions: [
        'PENERIMAAN_SURAT_PERINTAH',
        'UPDATE_TAHAPAN_INVESTIGASI',
        'UPLOAD_BUKTI_DAN_BAP',
        'INPUT_PROGRESS_LAPANGAN',
        'SUSUN_LHP_INVESTIGASI',
        'KIRIM_PROGRESS_ADMIN_INSPEKTUR'
      ],
      activeStatus: 'AKTIF',
      lastLogin: new Date().toISOString()
    }
  },
  {
    username: 'admin.wbs',
    pin: 'admin123',
    password: 'admin123',
    role: 'ADMIN',
    user: {
      id: 'usr-admin-01',
      username: 'admin.wbs',
      role: 'ADMIN',
      fullName: 'Johanes Rumbarar, S.STP',
      nip: '19880512 201101 1 003',
      jabatan: 'Administrator & Verifikator Pengaduan WBS',
      pangkatGolongan: 'Penata Tingkat I (III/d)',
      unitKerja: 'Sekretariat Inspektorat Daerah Kabupaten Teluk Wondama',
      email: 'admin.wbs@wondamakab.go.id',
      phone: '+62 813-9902-1144',
      avatarColor: 'bg-blue-600',
      initials: 'JR',
      permissions: [
        'VERIFIKASI_AWAL_KELAYAKAN',
        'DISPOSISI_KE_INSPEKTUR',
        'MONITORING_SELURUH_KASUS',
        'PUBLIKASI_PROGRES_PELAPOR',
        'MANAGEMENT_AUDIT_TRAIL',
        'CONFIG_NOTIFIKASI_EMAIL_SMS',
        'POSTGRESQL_API_ACCESS',
        'MANAJEMEN_AKUN_PEJABAT'
      ],
      activeStatus: 'AKTIF',
      lastLogin: new Date().toISOString()
    }
  }
];

export const OFFICIAL_ACCOUNTS = INITIAL_OFFICIAL_ACCOUNTS;

const STORAGE_KEY = 'wbs_wondama_official_accounts_v1';

export function getStoredAccounts(): UserCredential[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored accounts', e);
  }
  return INITIAL_OFFICIAL_ACCOUNTS;
}

export function saveStoredAccounts(accounts: UserCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving accounts to localStorage', e);
  }
}

export function authenticateUser(identifier: string, secret: string, customAccounts?: UserCredential[]): UserAccount | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanSecret = secret.trim();
  const accountList = customAccounts || getStoredAccounts();

  const match = accountList.find(acc => {
    if (acc.user.activeStatus === 'NONAKTIF') return false;

    const isUsernameMatch = acc.username.toLowerCase() === cleanId || 
                            acc.user.email.toLowerCase() === cleanId || 
                            (cleanId === 'admin' && acc.username === 'admin.wbs') ||
                            (cleanId === 'irban' && acc.username.includes('irban')) ||
                            (cleanId === 'inspektur' && acc.username.includes('inspektur'));
    
    if (!isUsernameMatch) return false;

    // Check PIN or Password
    return acc.pin === cleanSecret || acc.password === cleanSecret;
  });

  return match ? match.user : null;
}

export function getUserAccountByRole(role: UserRole, customAccounts?: UserCredential[]): UserAccount {
  const accountList = customAccounts || getStoredAccounts();
  const match = accountList.find(acc => acc.role === role && acc.user.activeStatus === 'AKTIF');
  if (match) return match.user;
  return accountList[0]?.user || INITIAL_OFFICIAL_ACCOUNTS[0].user;
}

export const ROLE_DETAILS = {
  INSPEKTUR: {
    title: 'Inspektur Daerah',
    subtitle: 'Pimpinan Pengawasan Daerah',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    colorHex: '#10B981',
    description: 'Otoritas tertinggi penandatanganan Surat Perintah Tugas (Sprint), disposisi tindak lanjut, dan rekomendasi LHP.',
    defaultTab: 'INSPEKTUR_VIEW'
  },
  IRBAN_INVESTIGASI: {
    title: 'Irban Investigasi',
    subtitle: 'Inspektur Pembantu Bidang Investigasi & Khusus',
    badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    colorHex: '#6366F1',
    description: 'Pelaksana audit investigasi, pemeriksaan lapangan, pembuatan Berita Acara Pemeriksaan (BAP), dan update progres tahapan kasus.',
    defaultTab: 'IRBAN_INVESTIGASI_VIEW'
  },
  ADMIN: {
    title: 'Admin WBS',
    subtitle: 'Administrator Sistem & Verifikator Kasus',
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    colorHex: '#3B82F6',
    description: 'Verifikasi kelayakan aduan, disposisi awal ke Inspektur, publikasi progres ke pelapor, manajemen akun pengguna, dan audit trail.',
    defaultTab: 'ADMIN_DASHBOARD'
  },
  PUBLIC: {
    title: 'Masyarakat / ASN Pelapor',
    subtitle: 'Akses Pengaduan Publik & Pelacakan Kasus',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    colorHex: '#94A3B8',
    description: 'Kirim pengaduan rahasia anonim dengan enkripsi AES-256 dan pantau perkembangan kasus secara mandiri.',
    defaultTab: 'CREATE_REPORT'
  }
};
