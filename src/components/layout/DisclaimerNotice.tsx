import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerNoticeProps {
  variant?: 'banner' | 'card' | 'footer';
  className?: string;
}

export const DisclaimerNotice: React.FC<DisclaimerNoticeProps> = ({ variant = 'banner', className = '' }) => {
  if (variant === 'card') {
    return (
      <div className={`p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl text-teal-950 ${className}`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-teal-900">Health Safety & Education Notice</p>
            <p className="text-teal-800">
              NutriCare AI provides nutrition education and organizational support. It does not diagnose diseases, replace a qualified healthcare professional, or prescribe treatment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`py-4 px-6 border-t border-slate-200/80 bg-slate-100/60 text-slate-600 text-xs text-center ${className}`}>
        <p className="max-w-4xl mx-auto leading-relaxed">
          <span className="font-medium text-slate-700">Medical Disclaimer:</span> NutriCare AI provides nutrition education and organizational support. It does not diagnose diseases, replace a qualified healthcare professional, or prescribe treatment. Never disregard professional clinical advice or delay seeking it because of information presented in this app.
        </p>
      </div>
    );
  }

  // Default top banner
  return (
    <aside
      aria-label="Medical disclaimer"
      className={`bg-slate-100/90 border-b border-slate-200 px-4 py-2 text-xs text-slate-700 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full text-center sm:text-left justify-center sm:justify-start">
        <ShieldAlert className="w-3.5 h-3.5 text-teal-700 shrink-0 hidden sm:inline-block" aria-hidden="true" />
        <span className="font-medium text-slate-900 shrink-0">Medical Notice:</span>
        <span className="text-slate-600 truncate">
          NutriCare AI provides nutrition education and organizational support. It does not diagnose diseases, replace a qualified healthcare professional, or prescribe treatment.
        </span>
      </div>
    </aside>
  );
};
