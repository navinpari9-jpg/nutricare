import React from 'react';
import { Menu, HeartPulse, Upload, Sparkles } from 'lucide-react';
import { useNutriCare } from '../../context/NutriCareContext';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of medical records, supported conditions, and quick nutrition tools',
  },
  'health-profile': {
    title: 'Health Profile',
    subtitle: 'Configure target conditions, dietary preferences, and known food sensitivities',
  },
  'medical-reports': {
    title: 'Medical Reports',
    subtitle: 'Manage laboratory test files and preview extracted clinical parameters',
  },
  'nutrition-planner': {
    title: 'Nutrition Planner',
    subtitle: 'Educational dietary guidance and structured whole-food meal ideas',
  },
  'food-scanner': {
    title: 'Food Scanner & Label Inspector',
    subtitle: 'Check packaged food nutrition facts, sodium thresholds, and ingredient labels',
  },
  history: {
    title: 'Activity History',
    subtitle: 'Audit log of files reviewed, profile edits, and nutrition inquiries',
  },
  settings: {
    title: 'Settings & Privacy',
    subtitle: 'Measurement units, display modes, and session data transparency',
  },
};

export const Header: React.FC = () => {
  const { activePage, setActivePage, setShowMobileNav, profile } = useNutriCare();
  const current = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left zone: Mobile toggle + Breadcrumb & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setShowMobileNav(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-teal-800">NutriCare AI</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-700">{current.title}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {current.title}
            </h2>
          </div>
        </div>

        {/* Right zone: Session status + Quick shortcut action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[11px] text-slate-400 font-medium">Session State</span>
            <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
              <span>Session Active</span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-700">
                {profile.conditions.length > 0
                  ? `${profile.conditions.length} condition${profile.conditions.length === 1 ? '' : 's'}`
                  : 'Profile Unconfigured'}
              </span>
            </span>
          </div>

          {activePage !== 'medical-reports' ? (
            <button
              onClick={() => setActivePage('medical-reports')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Upload Report</span>
              <span className="sm:hidden">Upload</span>
            </button>
          ) : (
            <button
              onClick={() => setActivePage('health-profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              <HeartPulse className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Edit Health Profile</span>
              <span className="sm:hidden">Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
