import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  NavigationPage,
  HealthProfile,
  UploadedFileRecord,
  NutritionProduct,
  ActivityLogItem,
  AppSettings,
  ExtractedMeasurement,
} from '../types';
import { extractTextFromPdf } from '../services/pdfExtractor';
import { extractTextFromImage } from '../services/ocrExtractor';
import { extractLaboratoryMeasurements } from '../services/measurementExtractor';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface NutriCareContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  profile: HealthProfile;
  saveProfile: (profile: HealthProfile) => void;
  resetProfile: () => void;
  uploadedFile: UploadedFileRecord | null;
  setUploadedFileRecord: (file: File) => void;
  removeUploadedFile: () => void;
  startReportExtraction: () => Promise<void>;
  updateExtractedMeasurement: (id: string, updated: Partial<ExtractedMeasurement>) => void;
  addManualMeasurement: (measurement: Omit<ExtractedMeasurement, 'id'>) => void;
  removeExtractedMeasurement: (id: string) => void;
  confirmMeasurements: () => void;
  reEditMeasurements: () => void;
  cancelReportExtraction: () => void;
  activeProduct: NutritionProduct | null;
  setActiveProduct: (product: NutritionProduct | null) => void;
  activities: ActivityLogItem[];
  addActivity: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showMobileNav: boolean;
  setShowMobileNav: (show: boolean) => void;
}

const DEFAULT_PROFILE: HealthProfile = {
  conditions: [],
  dietaryPreference: '',
  foodAllergies: [],
  foodsToAvoid: '',
  mealPreferences: '',
  updatedAt: undefined,
  isSaved: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  glucoseUnit: 'mg/dL',
  cholesterolUnit: 'mg/dL',
  pressureUnit: 'mmHg',
  compactMode: false,
  highContrast: false,
};

const NutriCareContext = createContext<NutriCareContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'nutricare_profile_v1';
const SETTINGS_STORAGE_KEY = 'nutricare_settings_v1';

export const NutriCareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Profile starts empty unless user entered and saved information in session
  const [profile, setProfile] = useState<HealthProfile>(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return DEFAULT_PROFILE;
  });

  // Uploaded file state (session only, starts null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFileRecord | null>(null);

  // Active product in food scanner (starts null)
  const [activeProduct, setActiveProduct] = useState<NutritionProduct | null>(null);

  // Activity logs (starts completely empty, populated only by actual user actions)
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  // App settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const saveProfile = (newProfile: HealthProfile) => {
    const updated: HealthProfile = {
      ...newProfile,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSaved: true,
    };
    setProfile(updated);
    try {
      sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    addActivity({
      type: 'profile',
      title: 'Health Profile Updated',
      description: updated.conditions.length > 0
        ? `Target conditions: ${updated.conditions.map((c) => c.toUpperCase()).join(', ')}`
        : 'Health profile updated with general preferences.',
    });
    addToast({
      type: 'success',
      title: 'Health Profile Saved',
      message: 'Preferences recorded for this session in local browser memory.',
    });
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    try {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // Ignore
    }
    addToast({
      type: 'info',
      title: 'Profile Cleared',
      message: 'Reverted profile preferences to blank initial state.',
    });
  };

  const setUploadedFileRecord = (file: File) => {
    // Revoke previous objectUrl if any
    if (uploadedFile?.objectUrl) {
      URL.revokeObjectURL(uploadedFile.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    const newRecord: UploadedFileRecord = {
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file,
      objectUrl,
      processingState: 'uploaded-unprocessed',
      processingProgress: 0,
      processingStatusMessage: 'Ready for text extraction',
      extractedMeasurements: [],
      confirmedMeasurements: [],
    };

    setUploadedFile(newRecord);
    addActivity({
      type: 'upload',
      title: 'Report Attached to Session',
      description: `${newRecord.name} (${(newRecord.size / 1024).toFixed(1)} KB)`,
    });
    addToast({
      type: 'success',
      title: 'Report File Attached',
      message: `${file.name} attached. Click "Extract Laboratory Data" to begin analysis.`,
    });
  };

  const removeUploadedFile = () => {
    if (uploadedFile) {
      if (uploadedFile.objectUrl) {
        URL.revokeObjectURL(uploadedFile.objectUrl);
      }
      const name = uploadedFile.name;
      setUploadedFile(null);
      addToast({
        type: 'info',
        title: 'File Removed',
        message: `Removed ${name} and associated extraction results from current session.`,
      });
      addActivity({
        type: 'upload',
        title: 'Report Removed from Session',
        description: `Deselected ${name}`,
      });
    }
  };

  const startReportExtraction = async () => {
    if (!uploadedFile || !uploadedFile.file) {
      return;
    }

    const file = uploadedFile.file;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    setUploadedFile((prev) =>
      prev
        ? {
            ...prev,
            processingState: 'extracting',
            processingProgress: 5,
            processingStatusMessage: isPdf ? 'Initializing PDF text parser...' : 'Initializing OCR engine...',
            errorMessage: undefined,
          }
        : null
    );

    try {
      let rawText = '';
      let isScannedPdf = false;
      let pageCount = 1;

      if (isPdf) {
        const result = await extractTextFromPdf(file, (percent, status) => {
          setUploadedFile((prev) =>
            prev ? { ...prev, processingProgress: percent, processingStatusMessage: status } : null
          );
        });

        rawText = result.text;
        isScannedPdf = result.isScannedPdf;
        pageCount = result.pageCount;

        if (isScannedPdf) {
          setUploadedFile((prev) =>
            prev
              ? {
                  ...prev,
                  processingState: 'no-text-found',
                  isScannedPdf: true,
                  pageCount,
                  rawExtractedText: '',
                  processingStatusMessage: 'Scanned image PDF detected',
                  errorMessage:
                    'This PDF appears to be a scanned image without an embedded digital text layer. Browser-based PDF text extraction cannot read scanned images directly. Please upload the report as an image file (PNG or JPG) to perform optical character recognition (OCR).',
                }
              : null
          );
          addToast({
            type: 'warning',
            title: 'Scanned PDF Detected',
            message: 'No embedded text layer found. Please upload as PNG/JPG to run optical character recognition.',
          });
          return;
        }
      } else {
        // Image format: PNG, JPG, JPEG
        const result = await extractTextFromImage(file, (percent, status) => {
          setUploadedFile((prev) =>
            prev ? { ...prev, processingProgress: percent, processingStatusMessage: status } : null
          );
        });

        rawText = result.text;

        if (result.isUnreadable) {
          setUploadedFile((prev) =>
            prev
              ? {
                  ...prev,
                  processingState: 'no-text-found',
                  rawExtractedText: rawText,
                  processingStatusMessage: 'Unreadable image',
                  errorMessage:
                    'No legible text could be resolved from this image. The photo may be blurry, low resolution, or poorly lit. Please upload a clearer, high-contrast photo of your report.',
                }
              : null
          );
          addToast({
            type: 'warning',
            title: 'No Readable Text',
            message: 'OCR could not resolve legible text. Please upload a clearer, higher-resolution photo.',
          });
          return;
        }
      }

      // Check if text is completely empty
      if (!rawText || rawText.trim().length === 0) {
        setUploadedFile((prev) =>
          prev
            ? {
                ...prev,
                processingState: 'no-text-found',
                rawExtractedText: '',
                processingStatusMessage: 'Empty document',
                errorMessage: 'No text content was found in this document.',
              }
            : null
        );
        return;
      }

      // Extract laboratory measurements using clinical rule parser
      const detected = extractLaboratoryMeasurements(rawText);

      setUploadedFile((prev) =>
        prev
          ? {
              ...prev,
              processingState: 'extracted-review',
              processingProgress: 100,
              processingStatusMessage: 'Text extracted — awaiting user confirmation',
              rawExtractedText: rawText,
              pageCount,
              extractedMeasurements: detected,
            }
          : null
      );

      addActivity({
        type: 'upload',
        title: 'Report Processed for Review',
        description: `Extracted ${detected.length} potential measurement${detected.length === 1 ? '' : 's'} from ${file.name}.`,
      });

      addToast({
        type: 'success',
        title: 'Report Text Extracted',
        message: `Identified ${detected.length} possible measurement${detected.length === 1 ? '' : 's'}. Please review and confirm below.`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during report processing.';
      setUploadedFile((prev) =>
        prev
          ? {
              ...prev,
              processingState: 'failed',
              processingStatusMessage: 'Processing failed',
              errorMessage: errorMsg,
            }
          : null
      );
      addToast({
        type: 'error',
        title: 'Processing Failed',
        message: 'Could not extract text from document. You can retry or choose another file.',
      });
    }
  };

  const updateExtractedMeasurement = (id: string, updated: Partial<ExtractedMeasurement>) => {
    setUploadedFile((prev) => {
      if (!prev) return null;
      const updatedList = prev.extractedMeasurements.map((m) =>
        m.id === id ? { ...m, ...updated, isEdited: true } : m
      );
      return { ...prev, extractedMeasurements: updatedList };
    });
  };

  const addManualMeasurement = (newMeas: Omit<ExtractedMeasurement, 'id'>) => {
    const item: ExtractedMeasurement = {
      ...newMeas,
      id: 'manual-' + Math.random().toString(36).substring(2, 9),
      isManuallyAdded: true,
      confidence: 'high',
    };
    setUploadedFile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        extractedMeasurements: [...prev.extractedMeasurements, item],
      };
    });
    addToast({
      type: 'info',
      title: 'Measurement Added',
      message: `Added ${item.name} to review list.`,
    });
  };

  const removeExtractedMeasurement = (id: string) => {
    setUploadedFile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        extractedMeasurements: prev.extractedMeasurements.filter((m) => m.id !== id),
      };
    });
  };

  const confirmMeasurements = () => {
    if (!uploadedFile) return;

    setUploadedFile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        processingState: 'confirmed',
        confirmedMeasurements: [...prev.extractedMeasurements],
      };
    });

    addActivity({
      type: 'upload',
      title: 'Laboratory Measurements Confirmed',
      description: `Confirmed ${uploadedFile.extractedMeasurements.length} laboratory parameter${
        uploadedFile.extractedMeasurements.length === 1 ? '' : 's'
      } from ${uploadedFile.name}.`,
    });

    addToast({
      type: 'success',
      title: 'Measurements Confirmed',
      message: 'Verified laboratory parameters are now recorded for this session.',
    });
  };

  const reEditMeasurements = () => {
    setUploadedFile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        processingState: 'extracted-review',
      };
    });
  };

  const cancelReportExtraction = () => {
    setUploadedFile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        processingState: 'uploaded-unprocessed',
        extractedMeasurements: [],
        confirmedMeasurements: [],
        rawExtractedText: undefined,
        errorMessage: undefined,
      };
    });
    addToast({
      type: 'info',
      title: 'Review Cancelled',
      message: 'Extracted results discarded without saving.',
    });
  };

  const addActivity = (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityLogItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: 'Just now',
    };
    setActivities((prev) => [newItem, ...prev.slice(0, 19)]);
  };

  const clearActivities = () => {
    setActivities([]);
    addToast({
      type: 'info',
      title: 'Activity Cleared',
      message: 'All session activity logs have been cleared.',
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Settings Updated',
      message: 'Interface preferences updated for current session.',
    });
  };

  // Close mobile nav on page change
  useEffect(() => {
    setShowMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  // Clean up objectUrl on unmount
  useEffect(() => {
    return () => {
      if (uploadedFile?.objectUrl) {
        URL.revokeObjectURL(uploadedFile.objectUrl);
      }
    };
  }, [uploadedFile?.objectUrl]);

  return (
    <NutriCareContext.Provider
      value={{
        activePage,
        setActivePage,
        profile,
        saveProfile,
        resetProfile,
        uploadedFile,
        setUploadedFileRecord,
        removeUploadedFile,
        startReportExtraction,
        updateExtractedMeasurement,
        addManualMeasurement,
        removeExtractedMeasurement,
        confirmMeasurements,
        reEditMeasurements,
        cancelReportExtraction,
        activeProduct,
        setActiveProduct,
        activities,
        addActivity,
        clearActivities,
        settings,
        updateSettings,
        toasts,
        addToast,
        removeToast,
        showMobileNav,
        setShowMobileNav,
      }}
    >
      {children}
    </NutriCareContext.Provider>
  );
};

export const useNutriCare = () => {
  const context = useContext(NutriCareContext);
  if (!context) {
    throw new Error('useNutriCare must be used within a NutriCareProvider');
  }
  return context;
};
