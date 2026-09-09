import React, { useState, useEffect, useRef } from 'react';
import { Report } from '../types/wbs';
import { decryptData } from '../lib/crypto';
import QRCode from 'qrcode';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Lock, 
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface PrintBeritaAcaraProps {
  report: Report;
  secretPin?: string;
  onClose: () => void;
}

export const PrintBeritaAcara: React.FC<PrintBeritaAcaraProps> = ({
  report,
  secretPin,
  onClose
}) => {
  const [showPinOnPrint, setShowPinOnPrint] = useState(true);
  const [summaryMode, setSummaryMode] = useState<'RINGKAS' | 'LENGKAP'>('RINGKAS');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');

  const effectivePin = secretPin || report.secretPinHash || '••••••';

  // Decrypt content once on load
  useEffect(() => {
    try {
      const plain = decryptData(report.descriptionEncrypted);
      setDecryptedText(plain);
    } catch {
      setDecryptedText('Gagal mendekripsi teks pengaduan.');
    }
  }, [report.descriptionEncrypted]);

  // Generate verification QR code
  useEffect(() => {
    const generateQr = async () => {
      try {
        const verifyContent = `https://wbs.telukwondamakab.go.id/track?ticket=${report.ticketCode}&hash=${report.sha256Digest.substring(0, 16)}`;
        const url = await QRCode.toDataURL(verifyContent, {
          width: 140,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    generateQr();
  }, [report.ticketCode, report.sha256Digest]);

  // Category Indonesian Label
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'KORUPSI_GRATIFIKASI':
        return 'Dugaan Tindak Pidana Korupsi, Suap & Gratifikasi';
      case 'FRAUD_KEUANGAN':
        return 'Kecurangan Finansial / Penyimpangan Pengelolaan Anggaran';
      case 'PENYALAHGUNAAN_WEWENANG':
        return 'Penyalahgunaan Wewenang & Jabatan Kedinasan';
      case 'PELECEHAN_SARA':
        return 'Diskriminasi SARA, Pelecehan & Pelanggaran Hak Sipil';
      case 'PELANGGARAN_KODE_ETIK':
        return 'Pelanggaran Disiplin & Kode Etik Aparatur Sipil Negara (ASN)';
      case 'PENGADAAN_BARANG_JASA':
        return 'Penyimpangan Pengadaan Barang dan Jasa Pemerintah Daerah';
      default:
        return 'Pengaduan Dugaan Pelanggaran Kedinasan Lainnya';
    }
  };

  // Date in Indonesian
  const dateObj = new Date(report.createdAt);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayName = days[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const yearNum = dateObj.getFullYear();
  const timeFormatted = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} WIT`;
  const fullDateIndo = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;

  // Nomor Berita Acara Resmi
  const nomorBeritaAcara = `BA-TT.WBS/700.1.2.1/${yearNum}/${report.ticketCode.replace('WBS-', '').replace(/-/g, '/')}`;

  // Get concise summary of the complaint
  const getConciseProblemSummary = () => {
    if (report.aiAnalysis?.summary && report.aiAnalysis.summary.trim().length > 0) {
      return report.aiAnalysis.summary.trim();
    }
    if (!decryptedText) return 'Sedang memuat uraian...';
    // If text is short, return as is
    if (decryptedText.length <= 280) {
      return decryptedText;
    }
    // Cut cleanly at sentence boundary or 280 chars
    const snippet = decryptedText.substring(0, 280);
    const lastPeriod = snippet.lastIndexOf('.');
    if (lastPeriod > 150) {
      return snippet.substring(0, lastPeriod + 1);
    }
    return snippet.trim() + '... (Uraian selengkapnya tercatat dalam sistem terenkripsi WBS).';
  };

  const conciseSummaryText = getConciseProblemSummary();

  // Generate Standalone Official Printable HTML
  const generateOfficialBeritaAcaraHtml = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tanda Terima Berita Acara WBS - ${report.ticketCode}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 18mm 15mm 18mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: "Bookman Old Style", Georgia, "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px double #000;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .logo-box {
      width: 75px;
      text-align: center;
      vertical-align: middle;
    }
    .logo-emblem {
      width: 65px;
      height: 65px;
      border: 2px solid #000;
      border-radius: 50%;
      display: inline-block;
      text-align: center;
      line-height: 61px;
      font-weight: 900;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      letter-spacing: 0.5px;
      background: #f8fafc;
    }
    .header-text {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      padding-left: 10px;
    }
    .header-text h3 {
      margin: 0;
      font-size: 12pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: bold;
      color: #111;
    }
    .header-text h2 {
      margin: 2px 0;
      font-size: 15pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 900;
      color: #000;
    }
    .header-text p {
      margin: 1px 0;
      font-size: 8pt;
      color: #222;
    }
    .doc-title {
      text-align: center;
      margin: 10px 0 14px 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    .doc-title h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .doc-title h4 {
      margin: 2px 0 0 0;
      font-size: 10.5pt;
      font-weight: bold;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .doc-title p {
      margin: 3px 0 0 0;
      font-size: 9.5pt;
      font-family: "Courier New", Courier, monospace;
      font-weight: bold;
    }
    .token-banner {
      width: 100%;
      border: 2px solid #0f172a;
      background-color: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 10px 0 12px 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    .token-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .token-grid td {
      vertical-align: middle;
      padding: 2px 4px;
    }
    .token-val {
      font-family: "Courier New", Courier, monospace;
      font-size: 14pt;
      font-weight: 900;
      color: #1d4ed8;
      letter-spacing: 1.5px;
    }
    .pin-val {
      font-family: "Courier New", Courier, monospace;
      font-size: 12pt;
      font-weight: 900;
      color: #b45309;
      letter-spacing: 2px;
    }
    .section-heading {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: #e2e8f0;
      padding: 4px 8px;
      margin-top: 10px;
      margin-bottom: 6px;
      border-left: 4px solid #1e3a8a;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    .data-table td {
      padding: 3px 4px;
      vertical-align: top;
    }
    .label-col {
      width: 180px;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif;
      color: #334155;
      font-size: 9pt;
    }
    .colon-col {
      width: 12px;
      text-align: center;
      font-weight: bold;
    }
    .summary-box {
      border: 1px solid #cbd5e1;
      background-color: #fff;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 9.5pt;
      line-height: 1.45;
      text-align: justify;
    }
    .legal-notes {
      font-size: 8pt;
      line-height: 1.35;
      color: #334155;
      margin-top: 8px;
      padding: 6px 10px;
      background-color: #f1f5f9;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .legal-notes ol {
      margin: 3px 0 0 0;
      padding-left: 16px;
    }
    .sig-table {
      width: 100%;
      margin-top: 16px;
      font-family: Arial, Helvetica, sans-serif;
      page-break-inside: avoid;
    }
    .sig-table td {
      vertical-align: top;
      text-align: center;
      width: 50%;
      font-size: 9pt;
    }
    .seal-box {
      margin: 4px auto;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stamp-badge {
      display: inline-block;
      border: 2px solid #7c3aed;
      color: #6d28d9;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transform: rotate(-3deg);
      background: rgba(245, 243, 255, 0.7);
    }
    .footer-audit {
      margin-top: 12px;
      border-top: 1px dashed #94a3b8;
      padding-top: 5px;
      font-family: "Courier New", Courier, monospace;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Kop Surat Resmi -->
  <table class="header-table">
    <tr>
      <td class="logo-box">
        <div class="logo-emblem">WONDAMA</div>
      </td>
      <td class="header-text">
        <h3>PEMERINTAH KABUPATEN TELUK WONDAMA</h3>
        <h2>INSPEKTORAT DAERAH</h2>
        <p>Jalan Poros Rasiei Kompleks Perkantoran Pemerintah Daerah, Isei, Teluk Wondama, Papua Barat</p>
        <p>Laman Resmi: https://wbs.telukwondamakab.go.id • Pos-el: inspektoratwondama@gmail.com</p>
      </td>
    </tr>
  </table>

  <!-- Judul Dokumen -->
  <div class="doc-title">
    <h2>BERITA ACARA TANDA TERIMA PENGADUAN</h2>
    <h4>SISTEM WHISTLEBLOWING (WBS) INSPEKTORAT DAERAH</h4>
    <p>NOMOR REGISTER: ${nomorBeritaAcara}</p>
  </div>

  <p style="margin: 6px 0 10px 0; font-size: 9.5pt; text-align: justify; text-indent: 24px;">
    Pada hari ini <strong>${fullDateIndo}</strong>, pukul <strong>${timeFormatted}</strong>, bertempat di Kantor Inspektorat Daerah Kabupaten Teluk Wondama, telah diterima dan dicatatkan secara elektronik Laporan Pengaduan Dugaan Pelanggaran melalui Sistem Whistleblowing (WBS) dengan rincian data tanda terima sebagai berikut:
  </p>

  <!-- Kotak Sorotan Token & PIN -->
  <div class="token-banner">
    <table class="token-grid">
      <tr>
        <td style="width: 55%;">
          <div style="font-size: 8.5pt; color: #475569; font-weight: bold; text-transform: uppercase;">
            NOMOR TOKEN / KODE TIKET RESMI WBS:
          </div>
          <div class="token-val">${report.ticketCode}</div>
          <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">
            Gunakan kode token ini untuk mengecek status tindak lanjut pengaduan.
          </div>
        </td>
        <td style="width: 25%; text-align: center; border-left: 1px dashed #cbd5e1; padding-left: 8px;">
          <div style="font-size: 8.5pt; color: #475569; font-weight: bold; text-transform: uppercase;">
            PIN RAHASIA KLIEN:
          </div>
          <div class="pin-val">${showPinOnPrint ? effectivePin : '••••••'}</div>
          <div style="font-size: 7.5pt; color: #64748b;">
            ${showPinOnPrint ? 'Kunci otentikasi pelapor' : 'Tersimpan aman di sistem'}
          </div>
        </td>
        <td style="width: 20%; text-align: right;">
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 68px; height: 68px; border: 1px solid #cbd5e1; padding: 2px; background: #fff;" alt="QR Verifikasi" />` : ''}
        </td>
      </tr>
    </table>
  </div>

  <!-- BAGIAN I: DATA REGISTRASI PENGADUAN -->
  <div class="section-heading">I. IDENTITAS PENERIMAAN & STATUS KERAHASIAAN</div>
  <table class="data-table">
    <tr>
      <td class="label-col">Saluran Penerimaan</td>
      <td class="colon-col">:</td>
      <td>Aplikasi WBS Inspektorat Teluk Wondama (Protokol Enkripsi AES-256)</td>
    </tr>
    <tr>
      <td class="label-col">Status Identitas Pelapor</td>
      <td class="colon-col">:</td>
      <td>
        <strong>${report.anonymity === 'ANONYMOUS' ? 'ANONIM (TERLINDUNGI PENUH OLEH HUKUM)' : 'RAHASIA TERENKRIPSI (CONFIDENTIAL)'}</strong>
        <br><span style="font-size: 8pt; color: #475569;">Berdasarkan UU RI No. 31 Tahun 2014 & Kebijakan Perlindungan Whistleblower Pemkab Teluk Wondama.</span>
      </td>
    </tr>
    <tr>
      <td class="label-col">Waktu Pencatatan Sistem</td>
      <td class="colon-col">:</td>
      <td>${fullDateIndo} pukul ${timeFormatted}</td>
    </tr>
    <tr>
      <td class="label-col">Unit Penyelenggara</td>
      <td class="colon-col">:</td>
      <td>Aparat Pengawasan Intern Pemerintah (APIP) Inspektorat Daerah Kab. Teluk Wondama</td>
    </tr>
  </table>

  <!-- BAGIAN II: PERMASALAHAN YANG DISAMPAIKAN SECARA RINGKAS -->
  <div class="section-heading">II. PERMASALAHAN YANG DISAMPAIKAN SECARA RINGKAS</div>
  <table class="data-table">
    <tr>
      <td class="label-col">Pokok Masalah / Perihal</td>
      <td class="colon-col">:</td>
      <td><strong>${report.subject}</strong></td>
    </tr>
    <tr>
      <td class="label-col">Kategori Dugaan Pelanggaran</td>
      <td class="colon-col">:</td>
      <td>${getCategoryLabel(report.category)}</td>
    </tr>
    <tr>
      <td class="label-col">Unit Kerja / Lokasi Kejadian</td>
      <td class="colon-col">:</td>
      <td>${report.location || 'Wilayah Pemerintahan Kabupaten Teluk Wondama'}</td>
    </tr>
    <tr>
      <td class="label-col">Waktu Dugaan Peristiwa</td>
      <td class="colon-col">:</td>
      <td>${report.incidentDate ? new Date(report.incidentDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak disebutkan'}</td>
    </tr>
    <tr>
      <td class="label-col">Estimasi Kerugian Daerah</td>
      <td class="colon-col">:</td>
      <td><strong>${report.estimatedLossRupiah ? `Rp ${report.estimatedLossRupiah.toLocaleString('id-ID')}` : 'Dalam proses telaah & pendalaman teknis auditor'}</strong></td>
    </tr>
    <tr>
      <td class="label-col">Ringkasan Uraian Masalah</td>
      <td class="colon-col">:</td>
      <td>
        <div class="summary-box">
          ${summaryMode === 'RINGKAS' ? conciseSummaryText : decryptedText}
        </div>
      </td>
    </tr>
    <tr>
      <td class="label-col">Bukti / Dokumen Awal</td>
      <td class="colon-col">:</td>
      <td>
        ${report.attachments && report.attachments.length > 0 
          ? `Terdapat <strong>${report.attachments.length} berkas bukti elektronik</strong> (${report.attachments.map(a => a.fileName).join(', ')}) yang tersimpan dalam sistem terenkripsi.`
          : 'Belum melampirkan berkas elektronik fisik tambahan.'}
      </td>
    </tr>
    <tr>
      <td class="label-col">Tingkat Prioritas Penanganan</td>
      <td class="colon-col">:</td>
      <td><span style="font-weight: bold; color: ${report.severity === 'KRITIS' ? '#be123c' : report.severity === 'TINGGI' ? '#b45309' : '#1d4ed8'};">${report.severity}</span> (Berdasarkan parameter analisis risiko awal)</td>
    </tr>
  </table>

  <!-- BAGIAN III: KETENTUAN HAK & PROSEDUR TINDAK LANJUT -->
  <div class="legal-notes">
    <strong>Ketentuan & Hak Pelapor:</strong>
    <ol>
      <li>Tanda Terima Berita Acara ini adalah bukti sah bahwa laporan pengaduan telah diterima secara resmi di register pengawasan internal Inspektorat Daerah Kabupaten Teluk Wondama.</li>
      <li>Identitas pelapor dan substansi materi pengaduan dijamin kerahasiaannya serta dilindungi dari segala bentuk tuntutan pidana/perdata dan diskriminasi kedinasan.</li>
      <li>Pelapor dapat memantau setiap tahapan perkembangan (Verifikasi Administrasi, Disposisi Inspektur, Audit Investigasi Irban, hingga Rekomendasi Hasil) secara berkala di portal <em>https://wbs.telukwondamakab.go.id</em> dengan memasukkan <strong>Nomor Token</strong> dan <strong>PIN Rahasia</strong>.</li>
      <li>Verifikasi administratif kelayakan berkas dilaksanakan paling lambat dalam 3 (tiga) hari kerja sejak tanda terima ini diterbitkan.</li>
    </ol>
  </div>

  <!-- Tanda Tangan Para Pihak -->
  <table class="sig-table">
    <tr>
      <td>
        <p style="margin: 0; color: #475569;">Pihak Pelapor / Pengadu,</p>
        <p style="margin: 2px 0 35px 0; font-weight: bold;">TERCATAT DIGITAL WBS</p>
        <div style="font-family: 'Courier New', monospace; font-size: 8pt; color: #475569; padding: 4px; border: 1px dashed #cbd5e1; display: inline-block; border-radius: 4px;">
          TOKEN VALID: ${report.ticketCode}
        </div>
        <p style="margin: 4px 0 0 0; font-size: 7.5pt; color: #64748b;">(Dilindungi Undang-Undang Kerahasiaan Saksi & Pelapor)</p>
      </td>
      <td>
        <p style="margin: 0; color: #475569;">Rasiei, ${dateNum} ${monthName} ${yearNum}</p>
        <p style="margin: 2px 0 10px 0; font-weight: bold;">INSPEKTORAT DAERAH KABUPATEN TELUK WONDAMA</p>
        <div class="seal-box">
          <div class="stamp-badge">
            INSPEKTORAT DAERAH<br>
            ★ TELUK WONDAMA ★<br>
            TERVALIDASI SISTEM
          </div>
        </div>
        <p style="margin: 4px 0 0 0; font-weight: bold; text-decoration: underline; font-size: 9.5pt;">TIM PENGELOLA WBS / APIP</p>
        <p style="margin: 1px 0 0 0; font-size: 8pt; color: #334155;">NIP. 19780512 200502 1 004</p>
      </td>
    </tr>
  </table>

  <!-- Footer Integritas Kriptografi -->
  <div class="footer-audit">
    <div>INTEGRITY SHA-256: ${report.sha256Digest}</div>
    <div>SISTEM INFORMASI WBS TELUK WONDAMA • CETAK: ${new Date().toLocaleString('id-ID')}</div>
  </div>
</body>
</html>`;
  };

  // Direct Invisible Iframe Printing
  const handleDirectPrint = () => {
    try {
      setPrintStatus('Mempersiapkan dokumen cetak...');
      const htmlContent = generateOfficialBeritaAcaraHtml();

      // Remove existing print frame if any
      const existingFrame = document.getElementById('wbs-berita-acara-iframe');
      if (existingFrame) {
        document.body.removeChild(existingFrame);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'wbs-berita-acara-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setPrintStatus('Jendela cetak tanda terima siap digunakan.');
            setTimeout(() => setPrintStatus(''), 4000);
          } catch (err) {
            console.warn('Iframe print error, falling back to window.print', err);
            window.print();
          }
        }, 500);
      } else {
        window.print();
      }
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    }
  };

  // Download Standalone HTML
  const handleDownloadHtml = () => {
    const htmlContent = generateOfficialBeritaAcaraHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Berita_Acara_Tanda_Terima_${report.ticketCode}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPrintStatus('Berkas Berita Acara berhasil diunduh.');
    setTimeout(() => setPrintStatus(''), 3000);
  };

  // Copy Summary Text
  const handleCopySummary = () => {
    const text = `=====================================================
PEMERINTAH KABUPATEN TELUK WONDAMA - INSPEKTORAT DAERAH
BERITA ACARA TANDA TERIMA PENGADUAN RESMI (WBS)
=====================================================
Nomor Register   : ${nomorBeritaAcara}
Nomor Token WBS  : ${report.ticketCode}
PIN Rahasia      : ${effectivePin}
Waktu Penerimaan : ${fullDateIndo}, ${timeFormatted}
Status Pelapor   : ${report.anonymity === 'ANONYMOUS' ? 'Anonim Terlindungi' : 'Rahasia Terenkripsi'}

RINGKASAN POKOK PERMASALAHAN:
-----------------------------------------------------
Perihal / Subjek : ${report.subject}
Kategori Dugaan  : ${getCategoryLabel(report.category)}
Lokasi Kejadian  : ${report.location || 'Kabupaten Teluk Wondama'}
Estimasi Nilai   : ${report.estimatedLossRupiah ? `Rp ${report.estimatedLossRupiah.toLocaleString('id-ID')}` : 'Dalam proses pendalaman'}
Ringkasan Fakta  : ${conciseSummaryText}

Status Dokumen   : Sah Tercatat di Database APIP Inspektorat Wondama
Pantau Kasus di  : https://wbs.telukwondamakab.go.id
Integrity Digest : ${report.sha256Digest.substring(0, 24)}...
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Cetak Format Berita Acara Tanda Terima Resmi</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  APIP
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Ref. Token: <span className="text-blue-400 font-bold">{report.ticketCode}</span> • {fullDateIndo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition"
              title="Buka dialog cetak browser atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
              title="Unduh file dokumen HTML mandiri"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span className="hidden md:inline">Unduh Berkas</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
              title="Salin ringkasan teks tanda terima"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span className="hidden md:inline">{copiedSummary ? 'Tersalin' : 'Salin'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Tutup dialog cetak"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options & Status Notification Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPinOnPrint}
                onChange={(e) => setShowPinOnPrint(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span>Tampilkan PIN Rahasia di Tanda Terima</span>
            </label>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSummaryMode('RINGKAS')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                  summaryMode === 'RINGKAS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Format Ringkas
              </button>
              <button
                type="button"
                onClick={() => setSummaryMode('LENGKAP')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                  summaryMode === 'LENGKAP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Format Lengkap
              </button>
            </div>
          </div>

          {printStatus && (
            <span className="text-emerald-400 text-xs font-semibold animate-pulse">
              ✓ {printStatus}
            </span>
          )}
        </div>

        {/* Document Preview Canvas (Emulating Paper A4 Document) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-2xl rounded-sm font-serif border border-slate-300 space-y-4 text-xs sm:text-sm leading-relaxed relative">
            
            {/* Kop Surat Resmi */}
            <div className="border-b-[3px] border-double border-black pb-3 mb-4 text-center font-sans">
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center font-black text-xs shrink-0 tracking-wider">
                  WONDAMA
                </div>
                <div className="space-y-0.5 text-center">
                  <h3 className="text-sm sm:text-base font-bold tracking-wider uppercase text-slate-800">
                    Pemerintah Kabupaten Teluk Wondama
                  </h3>
                  <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase text-black">
                    Inspektorat Daerah
                  </h2>
                  <p className="text-[10px] text-slate-600 font-medium">
                    Jalan Poros Rasiei Kompleks Perkantoran Pemerintah Daerah, Isei, Teluk Wondama, Papua Barat
                  </p>
                  <p className="text-[9.5px] text-slate-600 font-medium">
                    Laman Resmi: https://wbs.telukwondamakab.go.id • Pos-el: inspektoratwondama@gmail.com
                  </p>
                </div>
              </div>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center font-sans space-y-0.5 my-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
                Berita Acara Tanda Terima Pengaduan
              </h2>
              <h4 className="text-xs font-bold text-blue-900 tracking-wide uppercase">
                Sistem Whistleblowing (WBS) Inspektorat Daerah
              </h4>
              <p className="text-xs font-mono font-bold text-slate-700">
                NOMOR REGISTER: {nomorBeritaAcara}
              </p>
            </div>

            <p className="text-xs sm:text-[13px] text-justify indent-6">
              Pada hari ini <strong>{fullDateIndo}</strong>, pukul <strong>{timeFormatted}</strong>, bertempat di Kantor Inspektorat Daerah Kabupaten Teluk Wondama, telah diterima dan dicatatkan secara elektronik Laporan Pengaduan Dugaan Pelanggaran melalui Sistem Whistleblowing (WBS) dengan rincian data tanda terima sebagai berikut:
            </p>

            {/* Banner Token & PIN */}
            <div className="border-2 border-slate-900 bg-slate-50 p-3.5 rounded-lg font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Nomor Token / Kode Tiket Resmi WBS:
                  </div>
                  <div className="font-mono text-lg sm:text-xl font-black text-blue-700 tracking-wider">
                    {report.ticketCode}
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Simpan dan gunakan nomor token ini untuk mengecek status tindak lanjut pengaduan Anda.
                  </p>
                </div>

                <div className="sm:col-span-3 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3 space-y-1 text-left sm:text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    PIN Rahasia Klien:
                  </div>
                  <div className="font-mono text-base font-black text-amber-700 tracking-widest">
                    {showPinOnPrint ? effectivePin : '••••••'}
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    {showPinOnPrint ? 'Kunci autentikasi pelapor' : 'Disembunyikan'}
                  </span>
                </div>

                <div className="sm:col-span-2 flex justify-center sm:justify-end">
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Verifikasi"
                      className="w-16 h-16 border border-slate-300 p-1 bg-white rounded"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Bagian I: Data Penerimaan */}
            <div className="font-sans text-xs font-bold uppercase bg-slate-200 px-2.5 py-1 border-l-4 border-blue-900 text-slate-800 tracking-wider">
              I. Identitas Penerimaan & Status Kerahasiaan
            </div>
            <table className="w-full text-xs sm:text-[13px] border-collapse">
              <tbody>
                <tr>
                  <td className="w-44 font-sans font-bold text-slate-600 py-1">Saluran Penerimaan</td>
                  <td className="w-4 text-center font-bold">:</td>
                  <td className="py-1">Aplikasi WBS Inspektorat Teluk Wondama (Enkripsi End-to-End AES-256)</td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Status Identitas Pelapor</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">
                    <strong>{report.anonymity === 'ANONYMOUS' ? 'ANONIM (TERLINDUNGI PENUH OLEH HUKUM)' : 'RAHASIA TERENKRIPSI (CONFIDENTIAL)'}</strong>
                    <div className="text-[10px] text-slate-500">
                      Berdasarkan UU RI No. 31 Tahun 2014 & Kebijakan Perlindungan Whistleblower Pemkab Teluk Wondama.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Waktu Pencatatan Sistem</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">{fullDateIndo} pukul {timeFormatted}</td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Unit Penyelenggara</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">Inspektorat Daerah Kabupaten Teluk Wondama (APIP)</td>
                </tr>
              </tbody>
            </table>

            {/* Bagian II: Ringkasan Permasalahan */}
            <div className="font-sans text-xs font-bold uppercase bg-slate-200 px-2.5 py-1 border-l-4 border-blue-900 text-slate-800 tracking-wider">
              II. Permasalahan yang Disampaikan secara Ringkas
            </div>
            <table className="w-full text-xs sm:text-[13px] border-collapse">
              <tbody>
                <tr>
                  <td className="w-44 font-sans font-bold text-slate-600 py-1">Pokok Masalah / Perihal</td>
                  <td className="w-4 text-center font-bold">:</td>
                  <td className="py-1 font-bold text-slate-900">{report.subject}</td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Kategori Dugaan Pelanggaran</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">{getCategoryLabel(report.category)}</td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Unit Kerja / Lokasi Kejadian</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">{report.location || 'Wilayah Pemerintahan Kabupaten Teluk Wondama'}</td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Waktu Dugaan Peristiwa</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1">
                    {report.incidentDate 
                      ? new Date(report.incidentDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Tidak disebutkan'}
                  </td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Estimasi Kerugian Daerah</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1 font-bold">
                    {report.estimatedLossRupiah 
                      ? `Rp ${report.estimatedLossRupiah.toLocaleString('id-ID')}`
                      : 'Dalam proses telaah & pendalaman teknis auditor'}
                  </td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1 align-top">Ringkasan Pokok Aduan</td>
                  <td className="text-center font-bold align-top">:</td>
                  <td className="py-1">
                    <div className="bg-slate-50 border border-slate-300 p-3 rounded text-xs leading-relaxed text-justify">
                      {summaryMode === 'RINGKAS' ? conciseSummaryText : decryptedText}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Bukti / Dokumen Awal</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1 text-xs">
                    {report.attachments && report.attachments.length > 0 
                      ? `Terdapat ${report.attachments.length} berkas bukti elektronik (${report.attachments.map(a => a.fileName).join(', ')}) yang tersimpan aman.`
                      : 'Belum melampirkan berkas bukti fisik tambahan.'}
                  </td>
                </tr>
                <tr>
                  <td className="font-sans font-bold text-slate-600 py-1">Tingkat Urgensi Penanganan</td>
                  <td className="text-center font-bold">:</td>
                  <td className="py-1 font-sans font-bold">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      report.severity === 'KRITIS' ? 'bg-rose-100 text-rose-800' :
                      report.severity === 'TINGGI' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.severity}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bagian III: Petunjuk & Hak Pelapor */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-700 space-y-1 font-sans">
              <span className="font-bold text-slate-900 block">Ketentuan & Hak Pelapor:</span>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                <li>Tanda Terima Berita Acara ini merupakan bukti sah pengaduan telah terdaftar di register Inspektorat Teluk Wondama.</li>
                <li>Identitas pelapor dan isi materi pengaduan dilindungi penuh oleh hukum dari segala tuntutan atau diskriminasi.</li>
                <li>Pelapor dapat mengecek progres telaah berkas dan tindak lanjut investigasi di <strong>https://wbs.telukwondamakab.go.id</strong> dengan Nomor Token: <strong>{report.ticketCode}</strong>.</li>
                <li>Verifikasi administrasi awal dilaksanakan maksimal 3 (tiga) hari kerja sejak laporan diterima.</li>
              </ol>
            </div>

            {/* Tanda Tangan Para Pihak */}
            <div className="grid grid-cols-2 gap-6 pt-4 font-sans text-center text-xs">
              <div className="space-y-1">
                <p className="text-slate-600">Pihak Pelapor / Pengadu,</p>
                <p className="font-bold">TERCATAT DIGITAL WBS</p>
                <div className="py-4">
                  <div className="font-mono text-[10px] text-slate-600 border border-dashed border-slate-300 p-1.5 rounded inline-block">
                    TOKEN: {report.ticketCode}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  (Dilindungi UU Perlindungan Saksi & Pelapor)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-600">Rasiei, {dateNum} {monthName} {yearNum}</p>
                <p className="font-bold text-slate-900">INSPEKTORAT DAERAH KABUPATEN TELUK WONDAMA</p>
                <div className="py-2 flex justify-center">
                  <div className="border-2 border-purple-600 text-purple-700 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase -rotate-2 bg-purple-50/70">
                    INSPEKTORAT DAERAH<br />
                    TELUK WONDAMA<br />
                    ★ TERVALIDASI SISTEM ★
                  </div>
                </div>
                <p className="font-bold underline text-slate-900">TIM PENGELOLA WBS / APIP</p>
                <p className="text-[10px] text-slate-600">NIP. 19780512 200502 1 004</p>
              </div>
            </div>

            {/* Footer Kriptografi */}
            <div className="border-t border-dashed border-slate-300 pt-2 font-mono text-[9px] text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
              <span>INTEGRITY SHA-256: {report.sha256Digest.substring(0, 32)}...</span>
              <span>WBS KABUPATEN TELUK WONDAMA • CETAK: {new Date().toLocaleTimeString('id-ID')} WIT</span>
            </div>

          </div>
        </div>

        {/* Footer Modal Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dokumen sah tanda terima pengaduan resmi Inspektorat Daerah Kabupaten Teluk Wondama.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
