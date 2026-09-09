import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, 
  Play, 
  Copy, 
  Check, 
  Lock, 
  Globe, 
  Server, 
  Send, 
  Terminal,
  FileCode,
  Zap,
  Layers
} from 'lucide-react';
import { WBS_API_ENDPOINTS } from '../lib/mockData';
import { ApiEndpoint } from '../types/wbs';

export const ApiDocsView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(WBS_API_ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(WBS_API_ENDPOINTS[0].requestBody || {}, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<any | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(JSON.stringify(ep.requestBody || {}, null, 2));
    setResponseOutput(null);
  };

  const handleRunApiTest = () => {
    setResponseOutput(selectedEndpoint.responseExample);
  };

  const generateCurlCode = () => {
    let curl = `curl -X ${selectedEndpoint.method} "https://wbs.inspektoratwondama.go.id${selectedEndpoint.path}" \\\n`;
    Object.entries(selectedEndpoint.headers).forEach(([k, v]) => {
      curl += `  -H "${k}: ${v}" \\\n`;
    });
    if (selectedEndpoint.method !== 'GET' && requestBodyText) {
      curl += `  -d '${requestBodyText.replace(/\n/g, '')}'`;
    }
    return curl;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurlCode());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-900">
      {/* Stitch Top Banner */}
      <div className="bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1E293B] text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Code className="w-4 h-4 text-blue-400" />
            OpenAPI / RESTful v1.2 Specification
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Dokumentasi REST API WBS Inspektorat Wondama
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Spesifikasi antarmuka terenkripsi untuk integrasi sistem pengaduan dengan aplikasi seluler, portal pengawasan daerah, dan backend AI Inspektorat Wondama.
          </p>
        </div>

        <button
          type="button"
          onClick={copyCurl}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
        >
          {copiedCurl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedCurl ? 'cURL Tersalin!' : 'Salin cURL'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List Sidebar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase px-2 py-1 block">
            Daftar Endpoint API ({WBS_API_ENDPOINTS.length}):
          </span>

          <div className="space-y-2">
            {WBS_API_ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-slate-900 text-white'
                    }`}>
                      {ep.method}
                    </span>
                    {ep.secured && (
                      <Lock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold truncate">{ep.path}</p>
                  <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {ep.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Endpoint Inspector & Interactive Tester */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg">
                  {selectedEndpoint.method}
                </span>
                <span className="text-base font-mono font-black text-slate-900">{selectedEndpoint.path}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedEndpoint.description}</p>
            </div>

            <button
              type="button"
              onClick={handleRunApiTest}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              Uji Coba Request
            </button>
          </div>

          {/* Request Headers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Request Headers:</h4>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono text-[11px] space-y-1">
              {Object.entries(selectedEndpoint.headers).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500 font-bold">{k}:</span>
                  <span className="text-blue-700">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body Payload */}
          {selectedEndpoint.method !== 'GET' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Request Body (JSON):</h4>
              <textarea
                rows={5}
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none"
              />
            </div>
          )}

          {/* Interactive Response Payload Sandbox */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700">Response (JSON):</h4>
              {responseOutput && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  HTTP 200 OK
                </span>
              )}
            </div>

            <pre className="bg-[#0B132B] text-blue-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-72">
              {JSON.stringify(responseOutput || selectedEndpoint.responseExample, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
