import { PostgresTableSchema } from '../types/wbs';

export const POSTGRES_TABLES: PostgresTableSchema[] = [
  {
    tableName: "users",
    description: "Tabel pengguna internal (Investigator / Inspectorate / Admin WBS) & Pelapor terdaftar",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "Unique Identifier User (v4 UUID)" },
      { name: "username", type: "VARCHAR(50)", isNullable: false, description: "Username unik untuk login admin" },
      { name: "email_encrypted", type: "BYTEA / TEXT", isEncrypted: true, description: "Email terenkripsi AES-256" },
      { name: "password_hash", type: "VARCHAR(255)", isNullable: false, description: "Argon2id / bcrypt password hash" },
      { name: "role", type: "VARCHAR(20)", isNullable: false, description: "Enum: 'ADMIN_INSPECTOR', 'SUPERVISOR', 'PELAPOR'" },
      { name: "is_2fa_enabled", type: "BOOLEAN", description: "Status aktif autentikasi dua faktor" },
      { name: "totp_secret_encrypted", type: "BYTEA", isEncrypted: true, description: "Secret TOTP 2FA terenkripsi" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "Waktu pendaftaran akun" }
    ]
  },
  {
    tableName: "reports",
    description: "Tabel utama pengaduan / laporan WBS terenkripsi dengan integritas hash SHA-256",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "Primary Key Laporan" },
      { name: "ticket_code", type: "VARCHAR(30)", isNullable: false, description: "Kode Tiket Rahasia Unik (e.g. WBS-2026-9821-X3)" },
      { name: "secret_pin_hash", type: "VARCHAR(255)", isNullable: false, description: "Hash PIN Rahasia Pelapor untuk Akses Tiket" },
      { name: "anonymity_type", type: "VARCHAR(25)", isNullable: false, description: "Enum: 'ANONYMOUS', 'CONFIDENTIAL_IDENTIFIED'" },
      { name: "reporter_name_enc", type: "BYTEA / TEXT", isEncrypted: true, description: "Nama Pelapor (Null jika Anonim) - Terenkripsi AES-256" },
      { name: "reporter_email_enc", type: "BYTEA / TEXT", isEncrypted: true, description: "Email Pelapor (Null jika Anonim) - Terenkripsi AES-256" },
      { name: "reporter_phone_enc", type: "BYTEA / TEXT", isEncrypted: true, description: "Nomor HP Pelapor - Terenkripsi AES-256" },
      { name: "category", type: "VARCHAR(40)", isNullable: false, description: "Kategori Laporan (KORUPSI, FRAUD, PELECEHAN, dll)" },
      { name: "subject", type: "VARCHAR(200)", isNullable: false, description: "Judul / Subjek Ringkas Pengaduan" },
      { name: "description_enc", type: "TEXT", isEncrypted: true, isNullable: false, description: "Uraian Kronologi Lengkap Pengaduan Terenkripsi AES-256" },
      { name: "location", type: "VARCHAR(150)", description: "Lokasi Kejadian Indikasi Pelanggaran" },
      { name: "incident_date", type: "DATE", description: "Tanggal Peristiwa Kejadian" },
      { name: "estimated_loss_idr", type: "NUMERIC(15,2)", description: "Perkiraan Nilai Kerugian Negara / Perusahaan (IDR)" },
      { name: "status", type: "VARCHAR(20)", isNullable: false, description: "Status: 'BARU', 'TERVERIFIKASI', 'INVESTIGASI', 'TINDAK_LANJUT', 'SELESAI', 'DITOLAK'" },
      { name: "severity", type: "VARCHAR(15)", isNullable: false, description: "Tingkat Urgensi: 'RENDAH', 'SEDANG', 'TINGGI', 'KRITIS'" },
      { name: "sha256_digest", type: "CHAR(64)", isNullable: false, description: "Cryptographic Digest Hash SHA-256 untuk Audit Integritas Data" },
      { name: "assigned_investigator_id", type: "UUID", isForeign: true, references: "users(id)", description: "FK ke Tim Inspektur yang Ditugaskan" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "Waktu Pengiriman Laporan" },
      { name: "updated_at", type: "TIMESTAMPTZ", description: "Waktu Perubahan Terakhir" }
    ]
  },
  {
    tableName: "report_attachments",
    description: "Tabel bukti pendukung / dokumen lampiran laporan terenkripsi",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "ID Unik Berkas Bukti" },
      { name: "report_id", type: "UUID", isForeign: true, references: "reports(id)", isNullable: false, description: "FK ke Laporan Terkait" },
      { name: "file_name", type: "VARCHAR(255)", isNullable: false, description: "Nama Berkas Original" },
      { name: "file_size", type: "VARCHAR(20)", description: "Ukuran Berkas (KB/MB)" },
      { name: "file_type", type: "VARCHAR(50)", description: "MIME Type (PDF, PNG, MP4, DOCX, dll)" },
      { name: "encrypted_hash", type: "CHAR(64)", isNullable: false, description: "SHA-256 Fingerprint Berkas Terenkripsi" },
      { name: "storage_path_enc", type: "TEXT", isEncrypted: true, description: "Path Penyimpanan Blob Terenkripsi" },
      { name: "uploaded_at", type: "TIMESTAMPTZ", description: "Waktu Unggah Bukti" }
    ]
  },
  {
    tableName: "report_timelines",
    description: "Riwayat jejak status laporan secara terstruktur & transparan",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "ID Record Timeline" },
      { name: "report_id", type: "UUID", isForeign: true, references: "reports(id)", isNullable: false, description: "FK ke Laporan" },
      { name: "status", type: "VARCHAR(20)", isNullable: false, description: "Status Pada Tahapan Ini" },
      { name: "title", type: "VARCHAR(100)", isNullable: false, description: "Judul Ringkas Progres" },
      { name: "description", type: "TEXT", description: "Penjelasan Detail Progres Hasil Verifikasi / Investigasi" },
      { name: "actor", type: "VARCHAR(100)", isNullable: false, description: "Pihak Pemproses (e.g. Tim Inspektorat Wilayah 1)" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "Waktu Kejadian Status Baru" }
    ]
  },
  {
    tableName: "report_messages",
    description: "Kanal komunikasi 2 arah terenkripsi antara Pelapor Anonim & Inspektur",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "ID Pesan" },
      { name: "report_id", type: "UUID", isForeign: true, references: "reports(id)", isNullable: false, description: "FK ke Laporan" },
      { name: "sender_role", type: "VARCHAR(20)", isNullable: false, description: "Enum: 'PELAPOR', 'INVESTIGATOR', 'SYSTEM'" },
      { name: "sender_name", type: "VARCHAR(100)", description: "Label Pengirim (e.g. 'Pelapor #Anonim' atau 'Inspektur Muda')" },
      { name: "message_encrypted", type: "TEXT", isEncrypted: true, isNullable: false, description: "Pesan Terenkripsi AES-256" },
      { name: "is_read", type: "BOOLEAN", description: "Flag Status Dibaca" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "Waktu Pengiriman Pesan" }
    ]
  },
  {
    tableName: "audit_logs",
    description: "Tabel immutable audit log untuk transparansi & pertanggungjawaban sistem WBS",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "ID Log Audit" },
      { name: "report_ticket_code", type: "VARCHAR(30)", description: "Kode Tiket Terkait" },
      { name: "action", type: "VARCHAR(80)", isNullable: false, description: "Jenis Aksi (e.g. 'VERIFY_REPORT', 'DECRYPT_VIEW', 'UPDATE_STATUS')" },
      { name: "actor", type: "VARCHAR(100)", isNullable: false, description: "Pengguna / Sistem yang Melakukan Aksi" },
      { name: "ip_address", type: "VARCHAR(45)", description: "Alamat IP Klien" },
      { name: "details", type: "TEXT", description: "Detail Perubahan State" },
      { name: "hash_signature", type: "CHAR(64)", isNullable: false, description: "Signature Kriptografi Log untuk Mencegah Modifikasi Log" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "Waktu Kejadian Log" }
    ]
  },
  {
    tableName: "notifications",
    description: "Tabel antrian & log notifikasi multi-saluran (Email, SMS, Mobile Push)",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, description: "ID Notifikasi" },
      { name: "ticket_code", type: "VARCHAR(30)", isNullable: false, description: "Kode Tiket Laporan" },
      { name: "channel", type: "VARCHAR(20)", isNullable: false, description: "Enum: 'EMAIL', 'SMS', 'MOBILE_PUSH'" },
      { name: "recipient_enc", type: "BYTEA / TEXT", isEncrypted: true, description: "Penerima Terenkripsi" },
      { name: "title", type: "VARCHAR(150)", isNullable: false, description: "Judul Notifikasi" },
      { name: "body", type: "TEXT", isNullable: false, description: "Isi Ringkas Pesan Notifikasi" },
      { name: "status", type: "VARCHAR(15)", description: "Status Pengiriman: 'DELIVERED', 'READ', 'PENDING'" },
      { name: "sent_at", type: "TIMESTAMPTZ", description: "Waktu Notifikasi Terkirim" }
    ]
  }
];

export const FULL_POSTGRES_SQL_DDL = `-- =====================================================================
-- SKEMA BASIS DATA POSTGRESQL UNTUK WBS (WHISTLEBLOWING SYSTEM)
-- Menggunakan Enkripsi Data, Indeks Kinerja, & RLS (Row Level Security)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES
CREATE TYPE anonymity_type_enum AS ENUM ('ANONYMOUS', 'CONFIDENTIAL_IDENTIFIED');
CREATE TYPE report_status_enum AS ENUM ('BARU', 'TERVERIFIKASI', 'INVESTIGASI', 'TINDAK_LANJUT', 'SELESAI', 'DITOLAK');
CREATE TYPE severity_level_enum AS ENUM ('RENDAH', 'SEDANG', 'TINGGI', 'KRITIS');
CREATE TYPE notification_channel_enum AS ENUM ('EMAIL', 'SMS', 'MOBILE_PUSH');

-- 2. TABEL USERS (Inspektorat & Pengguna)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email_encrypted BYTEA NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN_INSPECTOR',
    is_2fa_enabled BOOLEAN DEFAULT TRUE,
    totp_secret_encrypted BYTEA,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL REPORTS (Laporan Pengaduan Utama)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(30) UNIQUE NOT NULL,
    secret_pin_hash VARCHAR(255) NOT NULL,
    anonymity_type anonymity_type_enum NOT NULL DEFAULT 'ANONYMOUS',
    reporter_name_enc BYTEA,
    reporter_email_enc BYTEA,
    reporter_phone_enc BYTEA,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description_enc TEXT NOT NULL,
    location VARCHAR(150),
    incident_date DATE,
    estimated_loss_idr NUMERIC(15,2),
    status report_status_enum NOT NULL DEFAULT 'BARU',
    severity severity_level_enum NOT NULL DEFAULT 'SEDANG',
    sha256_digest CHAR(64) NOT NULL,
    assigned_investigator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL REPORT ATTACHMENTS (Bukti Pendukung Terenkripsi)
CREATE TABLE report_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(20),
    file_type VARCHAR(50),
    encrypted_hash CHAR(64) NOT NULL,
    storage_path_enc TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL REPORT TIMELINES (Jejak Status Transparan)
CREATE TABLE report_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status report_status_enum NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    actor VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL REPORT MESSAGES (Obrolan 2 Arah Terenkripsi)
CREATE TABLE report_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    sender_name VARCHAR(100),
    message_encrypted TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL AUDIT LOGS (Log Aktivitas System & Admin)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_ticket_code VARCHAR(30),
    action VARCHAR(80) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    details TEXT,
    hash_signature CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABEL NOTIFICATIONS (Log Notifikasi Real-Time)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(30) NOT NULL,
    channel notification_channel_enum NOT NULL,
    recipient_enc BYTEA,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(15) DEFAULT 'DELIVERED',
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDEKS UNTUK KINERJA QUERY DENGAN BEBAN TINGGI
CREATE INDEX idx_reports_ticket_code ON reports(ticket_code);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_timelines_report_id ON report_timelines(report_id);
CREATE INDEX idx_messages_report_id ON report_messages(report_id);
CREATE INDEX idx_audit_ticket_code ON audit_logs(report_ticket_code);

-- 10. TRIGGER PENGUPDATEAN TIMESTAMPTZ OTOMATIS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_modtime
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
`;
