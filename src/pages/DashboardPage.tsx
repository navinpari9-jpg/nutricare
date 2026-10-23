import React from 'react';
import {
  Upload,
  UtensilsCrossed,
  Barcode,
  ArrowRight,
  Activity,
  Heart,
  Droplet,
  FileText,
  Clock,
  FileCheck,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { CONDITION_METADATA } from '../data/sampleData';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';
import { HealthCondition } from '../types';

export const DashboardPage: React.FC = () => {
  const { setActivePage, activities, profile, uploadedFile } = useNutriCare();

  const handleConditionClick = (_condition: HealthCondition) => {
    setActivePage('nutrition-planner');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-2">
            <span>Healthcare Nutrition Support</span>
            <span aria-hidden="true">·</span>
            <span>Nutrition & Report Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            NutriCare AI
          </h1>
          <p className="text-base sm:text-lg text-teal-900 font-medium mt-1">
            Understand your reports. Make informed food choices.
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Organize routine medical records, understand clinical biomarkers, and connect laboratory
            insights with targeted, whole-food nutrition strategies for diabetes, cholesterol, and blood pressure.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={() => setActivePage('medical-reports')}
            className="group flex flex-col p-4 text-left rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-md bg-teal-100/80 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-900 flex items-center justify-between">
              <span>Upload Report</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Attach PDF or image lab reports (PNG, JPG) for safe session viewing.
            </p>
          </button>

          <button
            onClick={() => setActivePage('nutrition-planner')}
            className="group flex flex-col p-4 text-left rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-900 flex items-center justify-between">
              <span>Explore Nutrition</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Browse structured whole-food meal ideas and educational nutrient guides.
            </p>
          </button>

          <button
            onClick={() => setActivePage('food-scanner')}
            className="group flex flex-col p-4 text-left rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Barcode className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-900 flex items-center justify-between">
              <span>Scan Food</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter barcodes or inspect nutritional labels for sodium, sugar, and fat.
            </p>
          </button>
        </div>
      </div>

      {/* Condition Education Cards (3 Focus Conditions) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Supported Health Conditions
            </h2>
            <p className="text-xs text-slate-500">
              Educational fundamentals and clinical metrics tracked for each condition
            </p>
          </div>
          <button
            onClick={() => setActivePage('health-profile')}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 self-start sm:self-auto py-1 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          >
            <span>Configure Health Profile</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Diabetes Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
                {profile.conditions.includes('diabetes') && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded">
                    Selected in Profile
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {CONDITION_METADATA.diabetes.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {CONDITION_METADATA.diabetes.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Key Factors:</span>
                  <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
                    {CONDITION_METADATA.diabetes.keyFactors.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-medium text-slate-700">Clinical Focus: </span>
                  {CONDITION_METADATA.diabetes.clinicalContext}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleConditionClick('diabetes')}
              className="mt-5 w-full py-2 px-3 text-xs font-semibold text-teal-900 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              <span>Explore Diabetes Meals</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
            </button>
          </div>

          {/* High Cholesterol Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                {profile.conditions.includes('cholesterol') && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded">
                    Selected in Profile
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {CONDITION_METADATA.cholesterol.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {CONDITION_METADATA.cholesterol.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Key Factors:</span>
                  <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
                    {CONDITION_METADATA.cholesterol.keyFactors.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-medium text-slate-700">Clinical Focus: </span>
                  {CONDITION_METADATA.cholesterol.clinicalContext}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleConditionClick('cholesterol')}
              className="mt-5 w-full py-2 px-3 text-xs font-semibold text-teal-900 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              <span>Explore Cholesterol Meals</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
            </button>
          </div>

          {/* Hypertension Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                {profile.conditions.includes('hypertension') && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded">
                    Selected in Profile
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {CONDITION_METADATA.hypertension.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {CONDITION_METADATA.hypertension.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Key Factors:</span>
                  <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
                    {CONDITION_METADATA.hypertension.keyFactors.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-medium text-slate-700">Clinical Focus: </span>
                  {CONDITION_METADATA.hypertension.clinicalContext}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleConditionClick('hypertension')}
              className="mt-5 w-full py-2 px-3 text-xs font-semibold text-teal-900 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              <span>Explore DASH & BP Meals</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Reports + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Medical Reports</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laboratory documents attached to your session
                </p>
              </div>
              <button
                onClick={() => setActivePage('medical-reports')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                <span>Upload</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {uploadedFile ? (
              <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40 space-y-2">
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono tabular-nums">{formatFileSize(uploadedFile.size)}</span>
                      <span className="mx-1">·</span>
                      <span>Attached at {uploadedFile.uploadedAt}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    {uploadedFile.processingState === 'confirmed'
                      ? `${uploadedFile.confirmedMeasurements.length} Confirmed Measurement${
                          uploadedFile.confirmedMeasurements.length === 1 ? '' : 's'
                        }`
                      : uploadedFile.processingState === 'extracted-review'
                      ? 'Extraction Ready — Needs Review'
                      : uploadedFile.processingState === 'extracting'
                      ? 'Extracting Text...'
                      : 'Uploaded (Unprocessed)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePage('medical-reports')}
                    className="font-semibold text-teal-800 hover:text-teal-950"
                  >
                    {uploadedFile.processingState === 'uploaded-unprocessed'
                      ? 'Extract Text →'
                      : uploadedFile.processingState === 'extracted-review'
                      ? 'Review Results →'
                      : 'View Report →'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No reports yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                  Attach your laboratory blood chemistry or blood pressure reports to organize them for this session.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('medical-reports')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  Upload Medical Report
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Files remain strictly in local browser memory and are not uploaded to external servers.
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of actions taken during this session
                </p>
              </div>
              <button
                onClick={() => setActivePage('history')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                <span>Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{act.title}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">{act.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                      {act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Your activity will appear here</p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                  Updating your health profile, attaching reports, or checking food labels will be logged in this session audit trail.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Session storage active</span>
            <span className="text-teal-800 font-medium">No cloud tracking</span>
          </div>
        </div>
      </div>

      {/* Health Safety Notice (Persistent) */}
      <DisclaimerNotice variant="card" />
    </div>
  );
};
