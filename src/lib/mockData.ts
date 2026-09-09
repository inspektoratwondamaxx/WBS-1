import { Report, AuditLog, NotificationItem, ApiEndpoint } from '../types/wbs';

export const INITIAL_REPORTS: Report[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const WBS_API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/api/v1/reports",
    description: "Membuat pengaduan WBS baru dengan enkripsi otomatis AES-256 pada field sensitif & pembuatan hash SHA-256",
    headers: {
      "Content-Type": "application/json",
      "X-WBS-Encryption": "AES-256-GCM"
    },
    requestBody: {
      anonymity: "ANONYMOUS",
      category: "KORUPSI_GRATIFIKASI",
      subject: "Dugaan Gratifikasi Lelang",
      description: "Uraian kronologi kejadian...",
      location: "Kantor Wilayah",
      incidentDate: "2026-08-01",
      estimatedLossRupiah: 150000000,
      twoFactorEnabled: false
    },
    responseExample: {
      success: true,
      ticketCode: "WBS-2026-9912-Z9",
      secretPin: "991200",
      sha256Digest: "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b",
      message: "Laporan berhasil didaftarkan dan dienkripsi."
    },
    secured: false
  },
  {
    method: "POST",
    path: "/api/v1/reports/track",
    description: "Memantau progres status laporan publik menggunakan Kode Tiket & PIN Rahasia (atau OTP 2FA)",
    headers: {
      "Content-Type": "application/json"
    },
    requestBody: {
      ticketCode: "WBS-2026-8812-A1",
      secretPin: "881200",
      totpCode: "123456"
    },
    responseExample: {
      ticketCode: "WBS-2026-8812-A1",
      status: "INVESTIGASI",
      subject: "Dugaan Mark-Up Harga Paket Pengadaan Server IT",
      timeline: [
        {
          status: "BARU",
          title: "Laporan Diterima Sistem WBS",
          timestamp: "2026-07-16T09:20:00Z"
        }
      ]
    },
    secured: false
  },
  {
    method: "POST",
    path: "/api/v1/auth/2fa/verify",
    description: "Verifikasi token TOTP 2FA 6-digit pelapor/admin untuk akses data terenkripsi tinggi",
    headers: {
      "Content-Type": "application/json"
    },
    requestBody: {
      secret: "JBSWY3DPEHPK3PXP",
      code: "894102"
    },
    responseExample: {
      valid: true,
      message: "Kode 2FA Valid. Akses diberikan."
    },
    secured: true
  },
  {
    method: "GET",
    path: "/api/v1/admin/reports",
    description: "Mendapatkan daftar seluruh pengaduan real-time dengan filter status & tingkat urgensi",
    headers: {
      "Authorization": "Bearer admin_jwt_token_here",
      "Content-Type": "application/json"
    },
    responseExample: {
      total: 3,
      reports: [
        {
          ticketCode: "WBS-2026-8812-A1",
          status: "INVESTIGASI",
          severity: "TINGGI",
          createdAt: "2026-07-16T09:20:00Z"
        }
      ]
    },
    secured: true
  },
  {
    method: "PATCH",
    path: "/api/v1/admin/reports/:ticketCode/status",
    description: "Memperbarui status investigasi laporan, menambah log timeline, dan mengirim notifikasi otomatis ke ponsel pelapor",
    headers: {
      "Authorization": "Bearer admin_jwt_token_here",
      "Content-Type": "application/json"
    },
    requestBody: {
      status: "TINDAK_LANJUT",
      noteTitle: "Selesai Pemeriksaan Saksi Khusus",
      noteDescription: "Laporan dilimpahkan ke Bidang Penindakan untuk evaluasi pengembalian kerugian negara.",
      notifyPelaporMobile: true
    },
    responseExample: {
      success: true,
      newStatus: "TINDAK_LANJUT",
      notificationSent: true
    },
    secured: true
  },
  {
    method: "POST",
    path: "/api/v1/reports/:ticketCode/messages",
    description: "Mengirim pesan obrolan terenkripsi 2 arah antara Pelapor dan Tim Inspektur",
    headers: {
      "Content-Type": "application/json"
    },
    requestBody: {
      senderRole: "PELAPOR",
      secretPin: "881200",
      message: "Berikut penjelasan detail tambahan yang diminta."
    },
    responseExample: {
      success: true,
      messageId: "msg-992",
      encryptedPayload: "AES256_GCM:QmVyaWt1dCBwZW5qZWxhc2Fu..."
    },
    secured: false
  }
];
