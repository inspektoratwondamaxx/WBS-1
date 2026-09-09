import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Table, 
  Key, 
  Lock, 
  Code, 
  Play, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Layers,
  Terminal,
  Server,
  Zap
} from 'lucide-react';
import { POSTGRES_TABLES, FULL_POSTGRES_SQL_DDL } from '../data/postgresSchema';
import { Report } from '../types/wbs';

interface DatabaseSchemaViewProps {
  reports: Report[];
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({ reports }) => {
  const [selectedTable, setSelectedTable] = useState(POSTGRES_TABLES[1]); // Default 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'TABLES' | 'ERD' | 'DDL_SQL' | 'QUERY_SANDBOX'>('TABLES');
  const [copiedSql, setCopiedSql] = useState(false);

  // SQL Query Sandbox State
  const [queryInput, setQueryInput] = useState("SELECT ticket_code, category, status, severity, estimated_loss_idr FROM reports WHERE status = 'INVESTIGASI';");
  const [queryResult, setQueryResult] = useState<any[] | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_POSTGRES_SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleRunQuery = () => {
    if (queryInput.toLowerCase().includes('from reports')) {
      const res = reports.map(r => ({
        ticket_code: r.ticketCode,
        category: r.category,
        status: r.status,
        severity: r.severity,
        estimated_loss_idr: r.estimatedLossRupiah ? `Rp ${r.estimatedLossRupiah.toLocaleString('id-ID')}` : '0',
        sha256_digest: r.sha256Digest.slice(0, 16) + '...'
      }));
      setQueryResult(res);
    } else {
      setQueryResult([
        { id: "usr-01", username: "inspektur.utama", role: "ADMIN_INSPECTOR", is_2fa_enabled: true },
        { id: "usr-02", username: "inspektur.wilayah1", role: "ADMIN_INSPECTOR", is_2fa_enabled: true }
      ]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      {/* Stitch Top Banner */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Database className="w-4 h-4 text-blue-400" />
            Arsitektur Relasional PostgreSQL 16
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Skema Basis Data WBS Inspektorat Wondama
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Struktur tabel terenkripsi AES-256, Foreign Key Constraints, Indeks B-Tree, dan Audit Trail terpadu untuk pengawasan pemerintahan yang akuntabel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopySql}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
        >
          {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedSql ? 'DDL SQL Tersalin!' : 'Salin DDL SQL'}
        </button>
      </div>

      {/* Segmented Control Sub-Tabs */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('TABLES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'TABLES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Table className="w-4 h-4" />
          Kamus Tabel ({POSTGRES_TABLES.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ERD')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'ERD'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Visualisasi ERD
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('DDL_SQL')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'DDL_SQL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code className="w-4 h-4" />
          Skrip DDL SQL
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('QUERY_SANDBOX')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'QUERY_SANDBOX'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-500" />
          SQL Query Sandbox
        </button>
      </div>

      {/* Subtab 1: Tables Dictionary */}
      {activeSubTab === 'TABLES' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table List Sidebar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase px-3 py-1">Daftar Tabel Database</h3>
            {POSTGRES_TABLES.map((t) => (
              <button
                key={t.tableName}
                type="button"
                onClick={() => setSelectedTable(t)}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedTable.tableName === t.tableName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">{t.tableName}</span>
                <span className="text-[10px] opacity-80">{t.columns.length} kol</span>
              </button>
            ))}
          </div>

          {/* Table Columns Detail */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">public.{selectedTable.tableName}</span>
                <h3 className="text-base font-black text-slate-900">{selectedTable.description}</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                {selectedTable.columns.length} Kolom
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-white font-black">
                  <tr>
                    <th className="p-3.5">Nama Kolom</th>
                    <th className="p-3.5">Tipe Data</th>
                    <th className="p-3.5">Nullable</th>
                    <th className="p-3.5">Keterangan & Enkripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-blue-700 flex items-center gap-1.5">
                        {col.isPrimary && <Key className="w-3.5 h-3.5 text-amber-500" />}
                        {col.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 font-medium">{col.type}</td>
                      <td className="p-3.5 text-slate-500">{col.isNullable ? 'YES' : 'NO'}</td>
                      <td className="p-3.5 text-slate-700">
                        {col.description}
                        {col.description.includes('Enkripsi') && (
                          <span className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            AES-256
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Relational ERD */}
      {activeSubTab === 'ERD' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Relasi Antar Entitas (Entity Relationship Diagram)</h3>
            <p className="text-xs text-slate-500">Hubungan data antara tabel reports, timelines, attachments, messages, dan notifications.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {POSTGRES_TABLES.map((t) => (
              <div key={t.tableName} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="bg-slate-900 text-white p-2 rounded-xl text-xs font-mono font-bold text-center">
                  {t.tableName}
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {t.columns.slice(0, 5).map((col) => (
                    <div key={col.name} className="flex justify-between text-slate-600">
                      <span>{col.name}</span>
                      <span className="text-slate-400">{col.type}</span>
                    </div>
                  ))}
                  {t.columns.length > 5 && (
                    <div className="text-[10px] text-blue-600 font-bold pt-1">
                      + {t.columns.length - 5} kolom lainnya...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: DDL SQL */}
      {activeSubTab === 'DDL_SQL' && (
        <div className="bg-[#0B132B] text-slate-200 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400">schema_inspektorat_wondama.sql</span>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold"
            >
              Salin SQL
            </button>
          </div>
          <pre className="overflow-x-auto max-h-96 text-emerald-300 leading-relaxed">
            {FULL_POSTGRES_SQL_DDL}
          </pre>
        </div>
      )}

      {/* Subtab 4: Query Sandbox */}
      {activeSubTab === 'QUERY_SANDBOX' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Konsol Simulasi Kueri PostgreSQL
            </h3>
            <p className="text-xs text-slate-500">Jalankan perintah kueri SQL langsung terhadap dataset WBS.</p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-medium">Contoh: SELECT * FROM reports WHERE status = 'INVESTIGASI';</span>
              <button
                type="button"
                onClick={handleRunQuery}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 cursor-pointer transition"
              >
                <Play className="w-3.5 h-3.5" />
                Eksekusi Kueri
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0F172A] text-white">
                  <tr>
                    {Object.keys(queryResult[0] || {}).map((k) => (
                      <th key={k} className="p-3">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queryResult.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((v: any, cidx) => (
                        <td key={cidx} className="p-3 text-slate-800">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
