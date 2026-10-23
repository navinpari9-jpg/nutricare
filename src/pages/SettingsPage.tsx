import React from 'react';
import {
  Settings,
  ShieldCheck,
  Eye,
  Sliders,
  RotateCcw,
  Info,
  Lock,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetProfile, clearActivities, addToast } = useNutriCare();

  const handleResetSession = () => {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    resetProfile();
    clearActivities();
    addToast({
      type: 'info',
      title: 'Session Memory Reset',
      message: 'All local session memory, cached records, and preference drafts have been cleared.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <Settings className="w-4 h-4 text-teal-700" />
              <span>Application Preferences & Governance</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Settings & Privacy</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Configure preferred clinical measurement units, display preferences, and inspect
              data handling policies.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium border border-slate-200">
              Phase 1 Client
            </span>
          </div>
        </div>
      </div>

      {/* Measurement Units Preferences */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">Clinical Measurement Units</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Blood Glucose Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Blood Glucose Standard
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Units for fasting glucose and HbA1c conversions.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ glucoseUnit: 'mg/dL' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  settings.glucoseUnit === 'mg/dL'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                mg/dL (US Standard)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ glucoseUnit: 'mmol/L' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  settings.glucoseUnit === 'mmol/L'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                mmol/L (International / SI)
              </button>
            </div>
          </div>

          {/* Cholesterol Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Lipid & Cholesterol Standard
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Units for Total Cholesterol, LDL-C, HDL-C, and Triglycerides.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ cholesterolUnit: 'mg/dL' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  settings.cholesterolUnit === 'mg/dL'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                mg/dL
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ cholesterolUnit: 'mmol/L' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  settings.cholesterolUnit === 'mmol/L'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                mmol/L
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interface Preferences */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Eye className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">Interface & Accessibility</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div>
              <p className="text-xs font-semibold text-slate-900">High Contrast Focus Indicators</p>
              <p className="text-[11px] text-slate-500">
                Enhance keyboard focus outlines and border contrast for WCAG AA conformance.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div>
              <p className="text-xs font-semibold text-slate-900">Compact Table Layout</p>
              <p className="text-[11px] text-slate-500">
                Reduce vertical padding on lab reports and nutrient facts tables.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) => updateSettings({ compactMode: e.target.checked })}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Privacy Information & Data Architecture Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">Privacy Information & Data Handling</h2>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            <strong className="text-slate-800">Local Browser Session Architecture: </strong>
            In Phase 1, NutriCare AI processes health profile preferences, test uploads, and food records exclusively within your browser session memory.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li>No cloud database or external accounts are provisioned.</li>
            <li>No medical files are transmitted across unverified public networks.</li>
            <li>No third-party advertising tracking or profiling pixels are included.</li>
            <li>Uploaded files remain in local RAM and are released upon page reload or file removal.</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-900 block">Clear Session Memory</span>
            <span className="text-[11px] text-slate-500 block">
              Discard all temporary profile fields and activity logs from this browser session.
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Session Data</span>
          </button>
        </div>
      </div>

      <DisclaimerNotice variant="card" />
    </div>
  );
};
