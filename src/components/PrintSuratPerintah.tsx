import React, { useRef, useState } from 'react';
import { SuratPerintah, Report } from '../types/wbs';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  QrCode, 
  FileText, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface PrintSuratPerintahProps {
  suratPerintah: SuratPerintah;
  report?: Report;
  onClose: () => void;
}

export const PrintSuratPerintah: React.FC<PrintSuratPerintahProps> = ({
  suratPerintah,
  report,
  onClose
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Generate complete HTML string for independent printing/downloading
  const generateOfficialDocumentHtml = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Perintah Tugas - ${suratPerintah.nomorSprint.replace(/\//g, '_')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm 20mm 20mm;
    }
    body {
      font-family: "Bookman Old Style", Georgia, "Times New Roman", serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 15px;
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
      border-radius: 8px;
      display: inline-block;
      line-height: 65px;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 11px;
    }
    .header-text {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
    }
    .header-text h3 {
      margin: 0;
      font-size: 13pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .header-text h2 {
      margin: 2px 0;
      font-size: 17pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 900;
    }
    .header-text p {
      margin: 1px 0;
      font-size: 8.5pt;
    }
    .doc-title {
      text-align: center;
      margin-top: 15px;
      margin-bottom: 15px;
      font-family: Arial, Helvetica, sans-serif;
    }
    .doc-title h2 {
      margin: 0;
      font-size: 14pt;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-title p {
      margin: 3px 0 0 0;
      font-size: 11pt;
      font-weight: bold;
    }
    .content-grid {
      width: 100%;
      margin-top: 8px;
      border-collapse: collapse;
    }
    .content-grid td {
      vertical-align: top;
      padding: 3px 0;
    }
    .label-col {
      width: 130px;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
    }
    .colon-col {
      width: 15px;
      font-weight: bold;
      text-align: center;
    }
    .text-justify {
      text-align: justify;
      text-justify: inter-word;
    }
    .team-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 6px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
    }
    .team-table th, .team-table td {
      border: 1px solid #000;
      padding: 5px 8px;
    }
    .team-table th {
      background-color: #f2f2f2;
      text-align: center;
    }
    .sig-table {
      width: 100%;
      margin-top: 25px;
      font-family: Arial, Helvetica, sans-serif;
    }
    .sig-table td {
      vertical-align: top;
    }
    .tte-box {
      border: 1px dashed #2563EB;
      background: #EFF6FF;
      padding: 8px 12px;
      border-radius: 6px;
      display: inline-block;
      text-align: center;
      font-size: 8.5pt;
      color: #1E3A8A;
      margin: 8px 0;
    }
    .tembusan {
      margin-top: 20px;
      font-size: 9.5pt;
      font-family: Arial, Helvetica, sans-serif;
      border-top: 1px solid #ccc;
      padding-top: 8px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td class="logo-box">
        <div class="logo-emblem">WONDAMA</div>
      </td>
      <td class="header-text">
        <h3>PEMERINTAH KABUPATEN TELUK WONDAMA</h3>
        <h2>INSPEKTORAT DAERAH</h2>
        <p>Jalan Poros Rasiei Kompleks Perkantoran Pemerintah Daerah, Isei, Teluk Wondama, Papua Barat</p>
        <p>Pos-el: inspektorat@wondamakab.go.id • Laman: https://inspektorat.wondamakab.go.id</p>
      </td>
    </tr>
  </table>

  <div class="doc-title">
    <h2>SURAT PERINTAH TUGAS</h2>
    <p>NOMOR: ${suratPerintah.nomorSprint}</p>
  </div>

  <table class="content-grid">
    <tr>
      <td class="label-col">DASAR</td>
      <td class="colon-col">:</td>
      <td class="text-justify">
        <ol style="margin: 0; padding-left: 18px;">
          ${suratPerintah.dasarHukum.map(d => `<li style="margin-bottom: 4px;">${d}</li>`).join('')}
        </ol>
      </td>
    </tr>
    <tr>
      <td class="label-col" style="padding-top: 8px;">MENIMBANG</td>
      <td class="colon-col" style="padding-top: 8px;">:</td>
      <td class="text-justify" style="padding-top: 8px;">
        <ol type="a" style="margin: 0; padding-left: 18px;">
          ${suratPerintah.menimbang.map(m => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
        </ol>
      </td>
    </tr>
  </table>

  <div style="text-align: center; margin: 12px 0 6px 0; font-family: Arial, sans-serif; font-weight: bold; letter-spacing: 1.5px; font-size: 11pt;">
    MEMERINTAHKAN:
  </div>

  <table class="content-grid">
    <tr>
      <td class="label-col">KEPADA</td>
      <td class="colon-col">:</td>
      <td>
        <table class="team-table">
          <thead>
            <tr>
              <th style="width: 30px;">NO</th>
              <th>NAMA / NIP</th>
              <th>JABATAN</th>
              <th>KEDUDUKAN DALAM TIM</th>
            </tr>
          </thead>
          <tbody>
            ${suratPerintah.timPemeriksa.map((tim, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td><strong>${tim.name}</strong><br><span style="font-size: 8.5pt; color: #444;">NIP. ${tim.nip}</span></td>
                <td>${tim.jabatan}</td>
                <td style="text-align: center; font-weight: bold; color: #1E3A8A;">${tim.peranTim.replace(/_/g, ' ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td class="label-col" style="padding-top: 8px;">UNTUK</td>
      <td class="colon-col" style="padding-top: 8px;">:</td>
      <td class="text-justify" style="padding-top: 8px;">
        <ol style="margin: 0; padding-left: 18px;">
          ${suratPerintah.untuk.map(u => `<li style="margin-bottom: 4px;">${u}</li>`).join('')}
        </ol>
        <div style="margin-top: 8px; font-family: Arial, sans-serif; font-size: 9.5pt;">
          <p style="margin: 2px 0;"><strong>Lokasi Sasaran:</strong> ${suratPerintah.lokasiPemeriksaan}</p>
          <p style="margin: 2px 0;"><strong>Jangka Waktu Tugas:</strong> ${new Date(suratPerintah.tanggalMulai).toLocaleDateString('id-ID', { dateStyle: 'long' })} s/d ${new Date(suratPerintah.tanggalSelesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        </div>
      </td>
    </tr>
  </table>

  <table class="sig-table">
    <tr>
      <td style="width: 45%;">
        <div style="border: 1px solid #ccc; padding: 10px; border-radius: 6px; font-size: 8.5pt;">
          <strong>KEABSAHAN ELEKTRONIK WBS</strong><br>
          <span style="font-family: monospace;">Ref: ${suratPerintah.reportTicketCode}</span><br>
          Dokumen ini sah & ditandatangani secara elektronik berdasar Sertifikasi BSrE / Sistem WBS Inspektorat Wondama.
        </div>
      </td>
      <td style="width: 55%; text-align: right; padding-right: 10px;">
        <div>Ditetapkan di: Rasiei</div>
        <div>Pada tanggal: ${new Date(suratPerintah.tanggalTerbit).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
        <div style="font-weight: bold; margin-top: 4px; text-transform: uppercase;">
          ${suratPerintah.pejabatPenandatangan.jabatan}
        </div>

        <div class="tte-box">
          <strong>TANDATANGAN ELEKTRONIK</strong><br>
          <span>${suratPerintah.pejabatPenandatangan.nama}</span><br>
          <span style="font-family: monospace; font-size: 7.5pt;">SHA256: ${suratPerintah.digitalSignatureHash.substring(0, 16)}</span>
        </div>

        <div style="font-weight: bold; text-decoration: underline;">
          ${suratPerintah.pejabatPenandatangan.nama}
        </div>
        <div style="font-size: 9pt;">${suratPerintah.pejabatPenandatangan.pangkatGolongan}</div>
        <div style="font-size: 9pt; font-family: monospace;">NIP. ${suratPerintah.pejabatPenandatangan.nip}</div>
      </td>
    </tr>
  </table>

  <div class="tembusan">
    <strong>Tembusan disampaikan kepada Yth:</strong><br>
    1. Bupati Teluk Wondama (sebagai laporan);<br>
    2. Wakil Bupati Teluk Wondama;<br>
    3. Sekretaris Daerah Kabupaten Teluk Wondama;<br>
    4. Yang Bersangkutan untuk dilaksanakan dengan penuh tanggung jawab;<br>
    5. Pertinggal / Arsip Dokumen Pengawasan.
  </div>
</body>
</html>`;
  };

  // 1. Direct Print using Invisible Iframe (works universally even inside sandboxed/nested frames)
  const handleDirectIframePrint = () => {
    try {
      setPrintStatus('Menyiapkan dokumen cetak...');
      const htmlContent = generateOfficialDocumentHtml();
      
      // Remove any existing print iframe
      const existingFrame = document.getElementById('wbs-print-iframe');
      if (existingFrame) {
        document.body.removeChild(existingFrame);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'wbs-print-iframe';
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
            setPrintStatus('Kotak dialog cetak berhasil dibuka.');
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
      console.error('Print trigger error', e);
      window.print();
    }
  };

  // 2. Open in New Clean Tab
  const handleOpenInNewTab = () => {
    const htmlContent = generateOfficialDocumentHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      // If popup blocked, download instead
      handleDownloadHtml();
    }
  };

  // 3. Download Standalone Document File (.html)
  const handleDownloadHtml = () => {
    const htmlContent = generateOfficialDocumentHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeNomor = suratPerintah.nomorSprint.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `Surat_Perintah_Tugas_${safeNomor}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPrintStatus('Dokumen resmi berhasil diunduh ke perangkat.');
    setTimeout(() => setPrintStatus(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full my-4 overflow-hidden border border-slate-200 print:border-none print:shadow-none print:my-0 print:rounded-none">
        
        {/* Action Header bar (Hidden on Print) */}
        <div className="bg-[#0B132B] text-white px-5 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg border border-emerald-400/30">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Dokumen Resmi Cetak
                </span>
                <span className="text-xs text-slate-400 font-mono">A4 Ready</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                Surat Perintah Tugas (SPT / Sprint)
              </h3>
              <p className="text-xs text-slate-300 font-mono">{suratPerintah.nomorSprint}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handleDirectIframePrint}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>

            {/* Open in New Window */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Buka tampilan cetak bersih di tab baru"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Tab Baru</span>
            </button>

            {/* Download File */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              title="Unduh berkas dokumen HTML resmi siap buka & cetak"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Unduh Berkas</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print status alert banner if triggered */}
        {printStatus && (
          <div className="bg-emerald-50 text-emerald-900 px-6 py-2 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{printStatus}</span>
          </div>
        )}

        {/* Paper Document Container (Standard A4 Official Layout) */}
        <div 
          ref={printContainerRef}
          id="printable-sprint-document"
          className="print-only-container p-6 sm:p-10 md:p-14 space-y-6 text-slate-950 bg-white font-serif leading-relaxed text-[13px] sm:text-[14px]"
        >
          {/* Official Government Letterhead (Kop Surat Resmi Pemkab Teluk Wondama) */}
          <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1 relative">
            <div className="flex items-center justify-center gap-4">
              {/* Emblem Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-blue-900 to-slate-900 text-white shadow-md border-2 border-amber-400">
                <ShieldCheck className="w-10 h-10 text-amber-300" />
              </div>
              
              <div className="space-y-0.5 font-sans">
                <h4 className="text-sm sm:text-base font-bold tracking-widest text-slate-800 uppercase">
                  Pemerintah Kabupaten Teluk Wondama
                </h4>
                <h1 className="text-lg sm:text-2xl font-black tracking-wider text-slate-950 uppercase">
                  Inspektorat Daerah
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                  Jalan Poros Rasiei Kompleks Perkantoran Pemerintah Daerah, Isei, Teluk Wondama, Papua Barat
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                  Pos-el: inspektorat@wondamakab.go.id • Laman: https://inspektorat.wondamakab.go.id
                </p>
              </div>
            </div>
          </div>

          {/* Document Title & Number */}
          <div className="text-center pt-2 space-y-1 font-sans">
            <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wide underline underline-offset-4 decoration-2">
              SURAT PERINTAH TUGAS
            </h2>
            <p className="text-xs sm:text-sm font-bold font-mono text-slate-800">
              NOMOR: {suratPerintah.nomorSprint}
            </p>
          </div>

          {/* Dasar Hukum Section */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold font-sans">DASAR</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-1.5 text-justify">
                {suratPerintah.dasarHukum.map((dasar, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="font-sans font-bold shrink-0">{idx + 1}.</span>
                    <span>{dasar}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Menimbang Section */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold font-sans">MENIMBANG</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-1 text-justify">
                {suratPerintah.menimbang.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="font-sans font-bold shrink-0">{String.fromCharCode(97 + idx)}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Memerintahkan */}
          <div className="text-center py-1">
            <span className="font-sans font-black text-sm tracking-widest uppercase">MEMERINTAHKAN:</span>
          </div>

          {/* Kepada: Tim Pemeriksa Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold font-sans">KEPADA</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-2">
                <table className="w-full border-collapse border border-slate-300 font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                      <th className="border border-slate-300 p-2 w-8">NO</th>
                      <th className="border border-slate-300 p-2 text-left">NAMA / NIP</th>
                      <th className="border border-slate-300 p-2 text-left">JABATAN</th>
                      <th className="border border-slate-300 p-2">KEDUDUKAN DALAM TIM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suratPerintah.timPemeriksa.map((tim, idx) => (
                      <tr key={tim.id || idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-2">
                          <p className="font-bold text-slate-900">{tim.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">NIP. {tim.nip}</p>
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700">{tim.jabatan}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-blue-900">
                          {tim.peranTim.replace(/_/g, ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Untuk Section */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold font-sans">UNTUK</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-1.5 text-justify">
                {suratPerintah.untuk.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="font-sans font-bold shrink-0">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
                
                <div className="pt-2 font-sans text-xs space-y-1 text-slate-800">
                  <p><strong>Lokasi Sasaran:</strong> {suratPerintah.lokasiPemeriksaan}</p>
                  <p><strong>Jangka Waktu Tugas:</strong> {new Date(suratPerintah.tanggalMulai).toLocaleDateString('id-ID', { dateStyle: 'long' })} s/d {new Date(suratPerintah.tanggalSelesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing & Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-4 font-sans text-xs">
            {/* Left QR Code Authenticity */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 flex items-center gap-3 space-y-0.5">
              <div className="w-14 h-14 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-1 shadow-sm shrink-0">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Keabsahan Elektronik WBS
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Ref: {suratPerintah.reportTicketCode}
                </p>
                <p className="text-[10px] text-slate-500">
                  Dokumen ini sah & ditandatangani secara elektronik bersertifikat BSrE / Inspektorat Wondama.
                </p>
              </div>
            </div>

            {/* Right Signature Block */}
            <div className="text-right space-y-1 pr-4">
              <p className="text-slate-600">Ditetapkan di: Rasiei</p>
              <p className="text-slate-600">Pada tanggal: {new Date(suratPerintah.tanggalTerbit).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              <p className="font-bold text-slate-900 uppercase pt-1">
                {suratPerintah.pejabatPenandatangan.jabatan}
              </p>
              
              {/* Official Stamp & E-Signature Graphic */}
              <div className="h-20 flex items-center justify-end py-1">
                <div className="border border-blue-300 bg-blue-50/90 text-blue-900 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold text-center inline-block shadow-sm">
                  <span className="block text-emerald-700 font-sans font-black text-xs">TANDATANGAN ELEKTRONIK</span>
                  <span>{suratPerintah.pejabatPenandatangan.nama}</span>
                  <span className="block text-[9px] text-slate-500">Hash: {suratPerintah.digitalSignatureHash.substring(0, 16)}</span>
                </div>
              </div>

              <p className="font-bold text-slate-950 underline underline-offset-2">
                {suratPerintah.pejabatPenandatangan.nama}
              </p>
              <p className="text-slate-600">{suratPerintah.pejabatPenandatangan.pangkatGolongan}</p>
              <p className="text-slate-600 font-mono">NIP. {suratPerintah.pejabatPenandatangan.nip}</p>
            </div>
          </div>

          {/* Tembusan */}
          <div className="pt-4 border-t border-slate-200 font-sans text-[11px] text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-800">Tembusan disampaikan kepada Yth:</p>
            <p>1. Bupati Teluk Wondama (sebagai laporan);</p>
            <p>2. Wakil Bupati Teluk Wondama;</p>
            <p>3. Sekretaris Daerah Kabupaten Teluk Wondama;</p>
            <p>4. Yang Bersangkutan untuk dilaksanakan dengan penuh tanggung jawab;</p>
            <p>5. Pertinggal / Arsip Dokumen Pengawasan.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
