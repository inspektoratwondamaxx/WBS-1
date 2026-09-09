import { InvestigationStage, SuratPerintah, SuratPerintahTeamMember } from '../types/wbs';

export const DEFAULT_DASAR_HUKUM = [
  "Undang-Undang Republik Indonesia Nomor 23 Tahun 2014 tentang Pemerintahan Daerah sebagaimana telah beberapa kali diubah terakhir dengan Undang-Undang Nomor 6 Tahun 2023.",
  "Undang-Undang Nomor 31 Tahun 1999 jo. Undang-Undang Nomor 20 Tahun 2001 tentang Pemberantasan Tindak Pidana Korupsi.",
  "Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintahan Daerah.",
  "Peraturan Menteri Dalam Negeri Republik Indonesia Nomor 48 Tahun 2021 tentang Pedoman Penanganan Pengaduan di Lingkungan Kemendagri dan Pemerintah Daerah.",
  "Peraturan Bupati Teluk Wondama Nomor 18 Tahun 2023 tentang Pedoman Sistem Penanganan Pengaduan Terpadu (Whistleblowing System) di Lingkungan Pemerintah Kabupaten Teluk Wondama."
];

export const DEFAULT_PEJABAT_PENANDATANGAN = {
  nama: "Drs. Jacobus Somambui, M.Si",
  nip: "19720415 199803 1 005",
  jabatan: "Inspektur Kabupaten Teluk Wondama",
  pangkatGolongan: "Pembina Utama Muda (IV/c)"
};

export const AVAILABLE_INVESTIGATORS: SuratPerintahTeamMember[] = [
  {
    id: "inv-01",
    name: "Hendrik Mansawan, S.E., M.Ak, CGCAE",
    nip: "19800812 200501 1 008",
    jabatan: "Inspektur Pembantu Khusus / Investigasi",
    peranTim: "PENGENDALI_TEKNIS"
  },
  {
    id: "inv-02",
    name: "Dra. Ratna Sarumpaet, M.Si, CFrA",
    nip: "19830214 200701 2 006",
    jabatan: "Auditor Ahli Madya Investigasi",
    peranTim: "KETUA_TIM"
  },
  {
    id: "inv-03",
    name: "Paulus Wamaer, S.T., CISA",
    nip: "19890520 201201 1 003",
    jabatan: "Auditor Ahli Muda Bidang IT & Forensik Digital",
    peranTim: "ANGGOTA_TIM"
  },
  {
    id: "inv-04",
    name: "Maria Imbiri, S.Ak",
    nip: "19941103 201801 2 004",
    jabatan: "Auditor Ahli Pertama / Analis Keuangan",
    peranTim: "ANGGOTA_TIM"
  },
  {
    id: "inv-05",
    name: "Yohanes Kaikatui, S.H.",
    nip: "19910317 201502 1 002",
    jabatan: "Analis Hukum & Tata Laksana Kepegawaian",
    peranTim: "ANGGOTA_TIM"
  }
];

export function createDefaultInvestigationStages(): InvestigationStage[] {
  return [
    {
      id: `stg-1-${Date.now()}`,
      stageNumber: 1,
      title: "Telaah Dokumen & Rencana Kerja Audit Investigatif (RKAI)",
      description: "Penyusunan hipotesis dugaan penyimpangan, pemetaan matriks bukti, dan penetapan prosedur pengujian fisik/dokumen.",
      status: "SELESAI",
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: "Matriks telaah audit investigatif disetujui Pengendali Teknis Irban Khusus.",
      actorName: "Dra. Ratna Sarumpaet (Ketua Tim)",
      publishedToReporter: true,
      publishedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: `stg-2-${Date.now()}`,
      stageNumber: 2,
      title: "Pengumpulan Bahan Keterangan (Pulbaket) & Bukti Lapangan",
      description: "Pemeriksaan fisik langsung, audit dokumen transaksi bank/HPS/kontrak, dan pengamanan log forensik.",
      status: "SELESAI",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      notes: "Telah dilakukan audit fisik di lokasi dan perbandingan harga pembanding distributor.",
      actorName: "Paulus Wamaer, S.T. & Maria Imbiri, S.Ak",
      publishedToReporter: true,
      publishedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: `stg-3-${Date.now()}`,
      stageNumber: 3,
      title: "Pemanggilan & Berita Acara Pemeriksaan (BAP) Saksi / Terlapor",
      description: "Klarifikasi resmi terhadap Pejabat Pembuat Komitmen (PPK), Pokja Pemilihan, Bendahara, dan pihak ketiga.",
      status: "SEDANG_BERJALAN",
      notes: "Jadwal klarifikasi PPK dan Rekanan dijadwalkan pada ruang sidang Inspektorat.",
      actorName: "Tim Pemeriksa Investigasi",
      publishedToReporter: true,
      publishedAt: new Date().toISOString()
    },
    {
      id: `stg-4-${Date.now()}`,
      stageNumber: 4,
      title: "Ekspose / Gelar Kasus Internal Tim Inspektorat",
      description: "Pemaparan hasil temuan sementara, pengujian kecukupan bukti formil & materil bersama Inspektur & Irban.",
      status: "BELUM_MULAI",
      notes: "Menunggu finalisasi Berita Acara Klarifikasi saksi kunci.",
      actorName: "Irban Investigasi",
      publishedToReporter: false
    },
    {
      id: `stg-5-${Date.now()}`,
      stageNumber: 5,
      title: "Penyusunan Naskah Laporan Hasil Pemeriksaan (LHP)",
      description: "Perumusan fakta hukum, perhitungan pasti kerugian keuangan daerah, dan klausul pertanggungjawaban.",
      status: "BELUM_MULAI",
      notes: "Drafting LHP Investigatif.",
      actorName: "Tim Perumus LHP",
      publishedToReporter: false
    },
    {
      id: `stg-6-${Date.now()}`,
      stageNumber: 6,
      title: "Penyerahan Naskah Rekomendasi & Tindak Lanjut ke Inspektur",
      description: "Penyampaian LHP final kepada Bupati Teluk Wondama & pelimpahan rekomendasi sanksi administratif/APH.",
      status: "BELUM_MULAI",
      notes: "Penyerahan final.",
      actorName: "Inspektur Daerah Teluk Wondama",
      publishedToReporter: false
    }
  ];
}

export function generateSprintNumber(seqNumber: number = 94): string {
  const romawiBulan = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const currentMonthRomawi = romawiBulan[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const paddedSeq = String(seqNumber).padStart(3, '0');
  return `SP.TUGAS/${paddedSeq}/ITDA-TW/${currentMonthRomawi}/${currentYear}`;
}
