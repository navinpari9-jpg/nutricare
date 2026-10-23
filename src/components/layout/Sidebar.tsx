import React from 'react';
import {
  LayoutDashboard,
  HeartPulse,
  FileText,
  UtensilsCrossed,
  Barcode,
  History,
  Settings,
  X,
  Stethoscope,
} from 'lucide-react';
import { useNutriCare } from '../../context/NutriCareContext';
import { NavigationPage } from '../../types';

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview, conditions & quick actions',
  },
  {
    id: 'health-profile',
    label: 'Health Profile',
    icon: HeartPulse,
    description: 'Conditions, diet & allergies',
  },
  {
    id: 'medical-reports',
    label: 'Medical Reports',
    icon: FileText,
    description: 'Upload files & lab records',
  },
  {
    id: 'nutrition-planner',
    label: 'Nutrition Planner',
    icon: UtensilsCrossed,
    description: 'Educational meals & guidance',
  },
  {
    id: 'food-scanner',
    label: 'Food Scanner',
    icon: Barcode,
    description: 'Barcode & nutritional label check',
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    description: 'Activity records & logs',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Units, preferences & privacy',
  },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, showMobileNav, setShowMobileNav, profile } = useNutriCare();

  const handleNavClick = (page: NavigationPage) => {
    setActivePage(page);
    setShowMobileNav(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
            <Stethoscope className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              NutriCare AI
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Nutrition & Health Assistant
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setShowMobileNav(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Application Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/60 shadow-2xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile quick summary card at sidebar bottom */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
          <span>Active Focus</span>
          <span className="text-[10px] text-teal-700 font-medium">Session Mode</span>
        </div>
        <div className="text-xs font-medium text-slate-800 capitalize leading-relaxed">
          {profile.conditions.length > 0
            ? profile.conditions.join(', ')
            : 'No conditions selected'}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          {profile.dietaryPreference || 'Not configured'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {showMobileNav && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
          onClick={() => setShowMobileNav(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden transform transition-transform duration-200 ease-in-out ${
          showMobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
