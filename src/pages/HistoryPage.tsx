import React, { useState } from 'react';
import {
  History,
  Trash2,
  FileText,
  HeartPulse,
  UtensilsCrossed,
  Barcode,
  Settings,
  Filter,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

export const HistoryPage: React.FC = () => {
  const { activities, clearActivities } = useNutriCare();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <FileText className="w-3.5 h-3.5 text-teal-700" />;
      case 'profile':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />;
      case 'nutrition':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />;
      case 'scan':
        return <Barcode className="w-3.5 h-3.5 text-sky-700" />;
      default:
        return <Settings className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <History className="w-4 h-4 text-teal-700" />
              <span>Session Audit Trail</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Activity History</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Audit log of file uploads, profile updates, and food label checks recorded during this browser session.
            </p>
          </div>

          {activities.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearActivities}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Recorded Actions:</span>
            <span className="font-mono text-xs font-bold tabular-nums text-slate-700">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3 h-3 text-slate-400 shrink-0" />
            {[
              { id: 'all', label: 'All Actions' },
              { id: 'upload', label: 'Reports' },
              { id: 'profile', label: 'Profile' },
              { id: 'scan', label: 'Scans' },
              { id: 'nutrition', label: 'Nutrition' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Activity Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your activity will appear here as you save health preferences, attach medical reports, or evaluate food items.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start gap-3 text-xs"
              >
                <div className="p-2 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DisclaimerNotice variant="card" />
    </div>
  );
};
