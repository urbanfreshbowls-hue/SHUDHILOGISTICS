import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CITY_HUBS, CITIES } from '../../constants/network';
import {
  Settings,
  Building,
  Key,
  Database,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Phone
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { bookings, agents, partners, settlements, auditLogs, resetAllData, showToast } = useApp();

  const [apsrtcApiKey, setApsrtcApiKey] = useState('APS_LOGISTICS_DEMO_KEY_SEC_9921');
  const [waToken, setWaToken] = useState('EAAOx...[Meta Cloud API Token Simulated]');
  const [supabaseUrl, setSupabaseUrl] = useState('https://shudhi-logistics.supabase.co');

  const handleExportJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      data: { bookings, agents, partners, settlements, auditLogs }
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `shudhi_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('System backup JSON downloaded successfully!', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed?.data?.bookings) {
            localStorage.setItem('shudhi_v2_bookings', JSON.stringify(parsed.data.bookings));
            if (parsed.data.agents) localStorage.setItem('shudhi_v2_agents', JSON.stringify(parsed.data.agents));
            if (parsed.data.partners) localStorage.setItem('shudhi_v2_partners', JSON.stringify(parsed.data.partners));
            if (parsed.data.settlements) localStorage.setItem('shudhi_v2_settlements', JSON.stringify(parsed.data.settlements));
            alert('Backup restored successfully! Refreshing...');
            window.location.reload();
          }
        } catch (err) {
          alert('Invalid backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hub Management & Integration Settings</h1>
        <p className="text-xs text-slate-500">
          Configure network hub addresses, transporter integration adapters, and data persistence safeguards.
        </p>
      </div>

      {/* Network Hub Directory */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
          <Building className="w-4 h-4 text-teal-600" />
          Primary Operational Hub Facilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CITIES.map(city => {
            const hub = CITY_HUBS[city];
            return (
              <div key={city} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{city}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-semibold">
                    Central Cargo Depot
                  </span>
                </div>
                <p className="text-slate-700 font-medium">{hub.name}</p>
                <p className="text-slate-500">{hub.address}</p>
                <p className="text-slate-600 flex items-center gap-1 font-mono pt-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {hub.phone}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Adapter Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
          <Key className="w-4 h-4 text-indigo-600" />
          Transporter & Communication API Adapters
        </h2>

        <div className="space-y-4 text-xs">
          {/* APSRTC */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">APSRTC Logistics Portal Gateway</span>
              <a
                href="https://logistics.apsrtconline.in/login"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-medium"
              >
                APSRTC Portal Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-500">
              Operating in High-Fidelity Simulation Mode. When official API credentials are authorized by APSRTC, enter your API Key below:
            </p>
            <input
              type="text"
              value={apsrtcApiKey}
              onChange={e => setApsrtcApiKey(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded font-mono bg-white text-slate-700"
            />
          </div>

          {/* WhatsApp Meta Cloud API */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-800 block">Meta WhatsApp Cloud Business API Token</span>
            <p className="text-slate-500">
              Single-number central router access token for official broadcast and message ingress:
            </p>
            <input
              type="text"
              value={waToken}
              onChange={e => setWaToken(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded font-mono bg-white text-slate-700"
            />
          </div>

          {/* Supabase PostgreSQL Backend Architecture */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Production Supabase PostgreSQL Data Layer</span>
            </div>
            <p className="text-slate-500">
              Application runs in persistent demo mode. Ready for export and migration to PostgreSQL schemas:
            </p>
            <input
              type="text"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded font-mono bg-white text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Backup & System Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
          <Database className="w-4 h-4 text-slate-700" />
          Data Backup & Demo Maintenance
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-800 block">Export or Restore System State</span>
            <span className="text-slate-500">Export complete JSON snapshots of all bookings, agents, and settlements.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
              <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-semibold text-rose-800 block text-xs">Reset All Demo Records</span>
            <span className="text-slate-500 text-xs">Wipe customized entries and reload 50 clean seed consignments.</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to clean seed records?')) {
                resetAllData();
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
