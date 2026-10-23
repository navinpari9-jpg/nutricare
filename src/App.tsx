/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NutriCareProvider, useNutriCare } from './context/NutriCareContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DisclaimerNotice } from './components/layout/DisclaimerNotice';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { HealthProfilePage } from './pages/HealthProfilePage';
import { MedicalReportsPage } from './pages/MedicalReportsPage';
import { NutritionPlannerPage } from './pages/NutritionPlannerPage';
import { FoodScannerPage } from './pages/FoodScannerPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activePage } = useNutriCare();

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'health-profile':
        return <HealthProfilePage />;
      case 'medical-reports':
        return <MedicalReportsPage />;
      case 'nutrition-planner':
        return <NutritionPlannerPage />;
      case 'food-scanner':
        return <FoodScannerPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Persistent Medical Disclaimer Banner */}
      <DisclaimerNotice variant="banner" />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Persistent Desktop Sidebar & Mobile Drawer */}
        <Sidebar />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {renderActivePage()}
          </main>

          {/* Bottom Persistent Disclaimer Footer */}
          <DisclaimerNotice variant="footer" />
        </div>
      </div>

      {/* Floating Feedback Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <NutriCareProvider>
      <AppContent />
    </NutriCareProvider>
  );
}
