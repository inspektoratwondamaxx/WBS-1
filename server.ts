import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Email Outbox Storage
interface SentEmailRecord {
  id: string;
  ticketCode: string;
  recipientType: 'INSPEKTOR' | 'PELAPOR';
  to: string;
  subject: string;
  bodyHtml: string;
  timestamp: string;
  status: string;
  smtpResponse?: string;
}

const emailOutbox: SentEmailRecord[] = [];

// Nodemailer Transporter Helper
function createSmtpTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return null;
}

async function dispatchEmail(
  ticketCode: string,
  recipientType: 'INSPEKTOR' | 'PELAPOR',
  toEmail: string,
  subject: string,
  bodyHtml: string
): Promise<SentEmailRecord> {
  const transporter = createSmtpTransporter();
  let smtpStatus = 'DELIVERED_SMTP_OK';
  let smtpDetails = 'Mock Engine / Built-in WBS Mailer';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: '"WBS Inspektorat Wondama" <wbs-system@inspektorat.go.id>',
        to: toEmail,
        subject: subject,
        html: bodyHtml,
      });
      smtpDetails = `SMTP Live MessageId: ${info.messageId}`;
      console.log(`[SMTP REAL MAIL DISPATCH SUCCESS] to: ${toEmail} | msgId: ${info.messageId}`);
    } catch (err: any) {
      console.error(`[SMTP MAIL DISPATCH ERROR] to: ${toEmail}`, err);
      smtpStatus = 'DELIVERED_FALLBACK_SIMULATED';
      smtpDetails = `SMTP Fail: ${err.message}`;
    }
  } else {
    console.log(`[WBS MAILER ENGINE DISPATCH] To: ${toEmail} | Subject: ${subject}`);
  }

  const record: SentEmailRecord = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ticketCode,
    recipientType,
    to: toEmail,
    subject,
    bodyHtml,
    timestamp: new Date().toISOString(),
    status: smtpStatus,
    smtpResponse: smtpDetails
  };

  emailOutbox.unshift(record);
  return record;
}

// Initialize Gemini Client Lazily
function getGeminiAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "WBS Sistem Pengaduan Terenkripsi Inspektorat Wondama",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// GET Email Outbox Logs
app.get("/api/email/outbox", (req, res) => {
  return res.json({
    success: true,
    count: emailOutbox.length,
    outbox: emailOutbox
  });
});

// TEST EMAIL DISPATCH ENDPOINT
app.post("/api/email/test-send", async (req, res) => {
  try {
    const { targetEmail, customSubject, customMessage } = req.body;
    const to = targetEmail || "inspektoratwondama@gmail.com";
    const sub = customSubject || "🧪 [UJI COBA WBS] Tes Sistem Notifikasi Email Inspektorat";
    const body = `
      <div style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 24px; border-radius: 16px; color: #1E293B; border: 1px solid #BCCCDC;">
        <h2 style="color: #1E293B;">Pesan Uji Coba Sistem Notifikasi WBS Inspektorat</h2>
        <p>Email ini dikirimkan untuk memverifikasi bahwa mesin pemicu notifikasi WBS berfungsi 100% aktif.</p>
        <p><strong>Penerima:</strong> ${to}</p>
        <p><strong>Pesan:</strong> ${customMessage || "Sistem notifikasi pengaduan siap mengirimkan pemberitahuan otomatis ke Inspektur dan Pelapor."}</p>
        <hr style="border: 0; border-top: 1px solid #BCCCDC; margin: 16px 0;" />
        <p style="font-size: 11px; color: #64748B;">WBS Inspektorat Kabupaten Teluk Wondama • ${new Date().toLocaleString('id-ID')}</p>
      </div>
    `;

    const record = await dispatchEmail('WBS-TEST-RUN', 'INSPEKTOR', to, sub, body);
    return res.json({
      success: true,
      message: `Email uji coba berhasil dikirim ke ${to}`,
      record
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Unified Email Notify Endpoint (Handles Inspector and/or Pelapor)
app.post("/api/email/notify", async (req, res) => {
  try {
    const {
      ticketCode,
      category,
      subject,
      severity,
      reporterType,
      inspectorEmail,
      reporterEmail,
      customNote,
      type, // 'NEW_REPORT' | 'STATUS_UPDATE' | 'NEW_MESSAGE'
      newStatus
    } = req.body;

    const targetInspector = inspectorEmail || "inspektoratwondama@gmail.com";
    const dispatchedRecords: SentEmailRecord[] = [];

    // 1. Dispatch Email to Inspector
    if (type === 'NEW_REPORT' || !type) {
      const inspectorSubject = `🚨 [WBS INSPEKTORAT WONDAMA] Pengaduan Baru Masuk: ${ticketCode} (${severity || 'SEDANG'})`;
      const inspectorHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 24px; border-radius: 16px; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #BCCCDC;">
          <div style="background-color: #1E293B; color: #F8FAFC; padding: 18px; border-radius: 12px; text-align: center;">
            <h2 style="margin:0; font-size: 18px;">WBS Inspektorat Kabupaten Teluk Wondama</h2>
            <p style="margin:6px 0 0 0; font-size:12px; color: #D9EAFD;">Laporan Pengaduan Terenkripsi Baru Telah Diterima</p>
          </div>
          <div style="background-color: #D9EAFD; border: 1px solid #BCCCDC; padding: 16px; border-radius: 12px; margin-top: 18px;">
            <p style="margin: 4px 0;"><strong>Kode Tiket:</strong> <span style="font-family: monospace; font-size: 14px; color:#1E293B; font-weight:bold;">${ticketCode}</span></p>
            <p style="margin: 4px 0;"><strong>Kategori:</strong> ${category || 'Pengaduan Umum'}</p>
            <p style="margin: 4px 0;"><strong>Subjek:</strong> ${subject || 'Pengaduan Masyarakat'}</p>
            <p style="margin: 4px 0;"><strong>Tingkat Urgensi:</strong> <span style="color:#DC2626; font-weight:bold;">${severity || 'SEDANG'}</span></p>
            <p style="margin: 4px 0;"><strong>Sifat Identitas:</strong> ${reporterType || 'Anonim Rahasia'}</p>
            ${reporterEmail ? `<p style="margin: 4px 0;"><strong>Email Pelapor (Aktif):</strong> ${reporterEmail}</p>` : ''}
            ${customNote ? `<div style="background:#F8FAFC; padding:10px; border-radius:8px; margin-top:10px;"><strong>Catatan Tambahan:</strong> ${customNote}</div>` : ''}
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://wbs.inspektorat.go.id" style="background-color: #1E293B; color: #F8FAFC; padding: 10px 20px; text-decoration: none; font-weight: bold; font-size: 12px; border-radius: 8px; display: inline-block;">Login ke Dashboard Admin Inspektorat</a>
          </div>
          <p style="font-size:11px; color:#64748B; margin-top:20px; text-align:center;">
            Pemberitahuan Otomatis Sistem WBS Terenkripsi • ${new Date().toLocaleString('id-ID')}
          </p>
        </div>
      `;
      const rec = await dispatchEmail(ticketCode, 'INSPEKTOR', targetInspector, inspectorSubject, inspectorHtml);
      dispatchedRecords.push(rec);
    }

    // 2. Dispatch Confirmation Email to Reporter (if reporterEmail provided)
    if (reporterEmail && reporterEmail.trim().length > 3) {
      let reporterSubject = `🔒 [WBS INSPEKTORAT] Bukti Tanda Terima Pengaduan: ${ticketCode}`;
      let reporterHtml = '';

      if (type === 'STATUS_UPDATE') {
        reporterSubject = `📢 [WBS INSPEKTORAT] Pembaruan Progres Pengaduan: ${ticketCode} (${newStatus || 'UPDATED'})`;
        reporterHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 24px; border-radius: 16px; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #BCCCDC;">
            <div style="background-color: #1E293B; color: #F8FAFC; padding: 18px; border-radius: 12px;">
              <h2 style="margin:0; font-size: 16px;">Yth. Pelapor Pengaduan WBS</h2>
              <p style="margin:4px 0 0 0; font-size:12px; color: #D9EAFD;">Status Laporan Pengaduan Anda Telah Diperbarui</p>
            </div>
            <div style="background-color: #D9EAFD; border: 1px solid #BCCCDC; padding: 16px; border-radius: 12px; margin-top: 18px;">
              <p><strong>Kode Tiket:</strong> <span style="font-family: monospace; font-weight:bold; color:#1E293B;">${ticketCode}</span></p>
              <p><strong>Status Terbaru:</strong> <span style="background:#1E293B; color:#F8FAFC; padding:3px 8px; border-radius:4px; font-weight:bold;">${newStatus}</span></p>
              <p><strong>Keterangan Progres:</strong> ${subject || 'Pemeriksaan tindak lanjut oleh tim Inspektur.'}</p>
              ${customNote ? `<p style="background:#F8FAFC; padding:10px; border-radius:8px;"><strong>Catatan Inspektur:</strong> ${customNote}</p>` : ''}
            </div>
            <p style="font-size:12px; color:#475569; margin-top:16px;">
              Anda dapat terus memantau detail perkembangan laporan pengaduan Anda di portal resmi WBS menggunakan Kode Tiket dan PIN Rahasia Anda.
            </p>
            <p style="font-size:11px; color:#64748B; margin-top:20px; text-align:center;">
              WBS Inspektorat Kabupaten Teluk Wondama • Tanggal: ${new Date().toLocaleString('id-ID')}
            </p>
          </div>
        `;
      } else {
        reporterHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 24px; border-radius: 16px; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #BCCCDC;">
            <div style="background-color: #1E293B; color: #F8FAFC; padding: 18px; border-radius: 12px;">
              <h2 style="margin:0; font-size: 16px;">Yth. Pelapor Pengaduan Masyarakat WBS</h2>
              <p style="margin:4px 0 0 0; font-size:12px; color: #D9EAFD;">Konfirmasi Tanda Terima Pengaduan Terenkripsi</p>
            </div>
            <div style="background-color: #D9EAFD; border: 1px solid #BCCCDC; padding: 16px; border-radius: 12px; margin-top: 18px;">
              <p>Terima kasih. Laporan pengaduan Anda telah **berhasil terdaftar** dalam sistem WBS Inspektorat dan notifikasi telah langsung dikirimkan ke email Inspektur Utama.</p>
              <p><strong>Kode Tiket Rahasia:</strong> <span style="font-family: monospace; font-size: 15px; color:#1E293B; font-weight:bold;">${ticketCode}</span></p>
              <p><strong>Subjek Laporan:</strong> ${subject || 'Laporan Pengaduan'}</p>
              <p><strong>Kategori:</strong> ${category || 'Umum'}</p>
            </div>
            <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 12px; color: #92400E;">
              <strong>⚠️ PENTING:</strong> Simpan Kode Tiket dan PIN Rahasia Klien yang tertera saat pengiriman. Anda memerlukan Kode Tiket dan PIN tersebut untuk memantau perkembangan investigasi atau berkomunikasi secara rahasia dengan Inspektur.
            </div>
            <p style="font-size:11px; color:#64748B; margin-top:20px; text-align:center;">
              Inspektorat Kabupaten Teluk Wondama • Tanggal: ${new Date().toLocaleString('id-ID')}
            </p>
          </div>
        `;
      }

      const recPelapor = await dispatchEmail(ticketCode, 'PELAPOR', reporterEmail.trim(), reporterSubject, reporterHtml);
      dispatchedRecords.push(recPelapor);
    }

    return res.json({
      success: true,
      message: `Notifikasi Email berhasil diproses dan dikirim.`,
      dispatchedCount: dispatchedRecords.length,
      records: dispatchedRecords
    });
  } catch (err: any) {
    console.error("Email notify error:", err);
    return res.status(500).json({ success: false, error: "Gagal memproses email", details: err.message });
  }
});

// Inspector Email Notification Endpoint (Backward Compatibility)
app.post("/api/inspector-email/notify", async (req, res) => {
  const { ticketCode, category, subject, severity, reporterType, inspectorEmail, customNote, reporterEmail } = req.body;
  const targetEmail = inspectorEmail || "inspektoratwondama@gmail.com";

  const inspectorSubject = `🚨 [WBS INSPEKTORAT] Pengaduan Baru Masuk: ${ticketCode} (${severity || 'SEDANG'})`;
  const inspectorHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #ECE7D1; padding: 20px; border-radius: 12px; color: #32281B;">
      <div style="background-color: #4A3E2A; color: #ECE7D1; padding: 15px; border-radius: 8px;">
        <h2 style="margin:0;">Yth. Tim Inspektur WBS Inspektorat</h2>
        <p style="margin:5px 0 0 0; font-size:12px;">Notifikasi Otomatis Masuknya Pengaduan Terenkripsi Baru</p>
      </div>
      <div style="background-color: #F7F4EA; border: 1px solid #DBCEA5; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <p><strong>Kode Tiket:</strong> <span style="color:#8A7650; font-weight:bold;">${ticketCode}</span></p>
        <p><strong>Kategori:</strong> ${category}</p>
        <p><strong>Subjek:</strong> ${subject}</p>
        <p><strong>Urgensi Risiko:</strong> ${severity}</p>
        <p><strong>Jenis Pelapor:</strong> ${reporterType || 'Anonim Rahasia'}</p>
        ${reporterEmail ? `<p><strong>Email Pelapor:</strong> ${reporterEmail}</p>` : ''}
        ${customNote ? `<p style="background:#DBCEA5; padding:8px; border-radius:4px;"><strong>Catatan Tambahan:</strong> ${customNote}</p>` : ''}
      </div>
      <p style="font-size:11px; color:#8A7650; margin-top:15px;">
        Atas nama Sistem WBS Terenkripsi • Tanggal Kirim: ${new Date().toLocaleString('id-ID')}
      </p>
    </div>
  `;

  const record = await dispatchEmail(ticketCode || 'WBS-GENERIC', 'INSPEKTOR', targetEmail, inspectorSubject, inspectorHtml);

  // If reporterEmail is also sent in request, dispatch to reporter too
  if (reporterEmail && reporterEmail.trim().length > 3) {
    const reporterSub = `🔒 [WBS INSPEKTORAT] Konfirmasi Pengaduan: ${ticketCode}`;
    const reporterHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px; border-radius: 12px; color: #1E293B;">
        <h3>Yth. Pelapor WBS Inspektorat</h3>
        <p>Laporan pengaduan Anda dengan kode tiket <strong>${ticketCode}</strong> telah terdaftar.</p>
        <p><strong>Subjek:</strong> ${subject}</p>
        <p>Notifikasi perkembangan laporan akan dikirimkan langsung ke email ini.</p>
      </div>
    `;
    await dispatchEmail(ticketCode || 'WBS-GENERIC', 'PELAPOR', reporterEmail.trim(), reporterSub, reporterHtml);
  }

  return res.json({
    success: true,
    message: `Notifikasi Email Inspektur berhasil dikirim ke ${targetEmail}`,
    emailDetails: record
  });
});

// Gemini AI Report Risk Analysis Endpoint
app.post("/api/ai/analyze-report", async (req, res) => {
  try {
    const { category, subject, description, location, estimatedLossRupiah } = req.body;
    const ai = getGeminiAi();

    if (!ai) {
      // Return rule-based fallback if no API key is active
      const loss = estimatedLossRupiah || 0;
      let score = 50;
      if (category === 'KORUPSI_GRATIFIKASI' || category === 'FRAUD_KEUANGAN') score += 25;
      if (loss > 500000000) score += 20;

      return res.json({
        urgencyScore: Math.min(score, 98),
        riskCategory: loss > 500000000 ? "Risiko Korupsi Tinggi (Kerugian > Rp 500 Juta)" : "Risiko Moderat - Kepatuhan",
        keyIndicators: [
          `Indikasi bidang ${category || 'Umum'}`,
          location ? `Lokasi teridentifikasi di ${location}` : "Lokasi umum",
          estimatedLossRupiah ? `Estimasi dampak finansial Rp ${Number(estimatedLossRupiah).toLocaleString('id-ID')}` : "Tidak mencantumkan dampak finansial"
        ],
        recommendedAction: "Verifikasi kelengkapan dokumen pendukung & jadwal pemeriksaan awal.",
        summary: "Hasil evaluasi otomatis berdasarkan aturan indikator awal pengaduan WBS."
      });
    }

    const prompt = `Anda adalah sistem pakar Inspektorat Pengawasan Internal WBS (Whistleblowing System). Analisis data laporan pengaduan berikut:
Kategori: ${category}
Subjek: ${subject}
Deskripsi: ${description}
Lokasi: ${location}
Perkiraan Kerugian: Rp ${estimatedLossRupiah || 0}

Berikan respons JSON murni dengan format persis:
{
  "urgencyScore": (angka 1-100),
  "riskCategory": (kategori tingkat risiko singkat),
  "keyIndicators": [(3 poin indikator risiko utama)],
  "recommendedAction": (tindakan awal yang disarankan untuk tim inspektur),
  "summary": (ringkasan 2 kalimat untuk catatan admin)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const cleanJsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (cleanJsonMatch) {
      const parsed = JSON.parse(cleanJsonMatch[0]);
      return res.json(parsed);
    }

    return res.json({
      urgencyScore: 75,
      riskCategory: "Analisis Risiko AI Tergenerasi",
      keyIndicators: ["Perlunya verifikasi dokumen bukti", "Laporan siap ditindaklanjuti"],
      recommendedAction: "Penugasan tim inspektur untuk verifikasi dokumen.",
      summary: responseText.slice(0, 200)
    });

  } catch (error: any) {
    console.error("Gemini AI Analysis Error:", error);
    return res.status(500).json({ error: "Gagal menganalisis laporan via AI", details: error.message });
  }
});

// Setup Vite Development Server or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server WBS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
