import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCheck,
  Trash2,
  AlertTriangle,
  Info,
  Shield,
  Play,
  RotateCcw,
  CheckCircle2,
  PlusCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  Edit2,
  Check,
  X,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { ExtractedMeasurement } from '../types';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export const MedicalReportsPage: React.FC = () => {
  const {
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
    addToast,
  } = useNutriCare();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual measurement form state
  const [manualForm, setManualForm] = useState({
    name: '',
    value: '',
    unit: '',
    referenceRange: '',
  });

  const validateAndHandleFile = (file: File) => {
    setValidationError(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        `Selected file exceeds the maximum limit of 10 MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      return;
    }

    // Validate type
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

    if (!hasValidExt && !hasValidMime) {
      setValidationError('Invalid file type. Please upload a PDF document, PNG image, or JPG/JPEG photo.');
      return;
    }

    setUploadedFileRecord(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndHandleFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndHandleFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.value.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide both a measurement name and a value.',
      });
      return;
    }

    addManualMeasurement({
      name: manualForm.name.trim(),
      value: manualForm.value.trim(),
      unit: manualForm.unit.trim(),
      referenceRange: manualForm.referenceRange.trim(),
      rawSnippet: 'Manually entered by user during report review',
      confidence: 'high',
    });

    setManualForm({ name: '', value: '', unit: '', referenceRange: '' });
    setShowAddModal(false);
  };

  const processingState = uploadedFile ? uploadedFile.processingState : 'no-report';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Medical Records & Text Extraction</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Medical Reports</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Upload blood work, lipid panels, or metabolic profiles. NutriCare AI extracts text locally in your browser
              using PDF.js and Tesseract.js OCR, allowing you to review and confirm detected measurements.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium border border-slate-200">
              Accepted: PDF, PNG, JPG
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Max 10 MB · Local Browser Processing</p>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-950">File Upload Error</p>
            <p className="mt-0.5 text-red-800 leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

      {/* STATE 1: No report uploaded — Upload Zone */}
      {processingState === 'no-report' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Upload a Medical Report</h2>
          <p className="text-xs text-slate-500 mb-4">
            Select or drag your laboratory PDF or high-resolution test result photo below.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver
                ? 'border-teal-600 bg-teal-50/50'
                : 'border-slate-200 hover:border-teal-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFileInputChange}
              className="hidden"
              id="report-file-picker"
            />
            <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Drop your report here or browse files
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports standard laboratory documents: PDF with embedded text, or PNG/JPG for OCR (up to 10 MB).
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              Choose Report File
            </button>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>Privacy & Local Execution Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Medical reports are processed locally within your browser sandbox. No document contents or extracted medical readings are uploaded to remote servers or external AI APIs.
            </p>
          </div>
        </div>
      )}

      {/* STATE 2 & COMMON: Report Uploaded Header Card */}
      {uploadedFile && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 break-all">{uploadedFile.name}</h3>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                    {uploadedFile.type.includes('pdf') ? 'PDF Document' : 'Image Photo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                  <span className="tabular-nums font-mono">{formatFileSize(uploadedFile.size)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Attached at {uploadedFile.uploadedAt}</span>
                  {uploadedFile.pageCount && uploadedFile.pageCount > 1 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{uploadedFile.pageCount} pages</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="text-teal-800">Local Session File</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {processingState === 'uploaded-unprocessed' && (
                <button
                  type="button"
                  onClick={startReportExtraction}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Extract Laboratory Data</span>
                </button>
              )}

              <button
                type="button"
                onClick={removeUploadedFile}
                className="px-3 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>
          </div>

          {/* STATE 2: Uploaded, Not Processed Notice */}
          {processingState === 'uploaded-unprocessed' && (
            <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-lg text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-teal-950">
                <FileSearch className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Ready for Local Report Analysis</span>
              </div>
              <p className="leading-relaxed">
                Click <strong className="text-teal-900">&quot;Extract Laboratory Data&quot;</strong> above to scan for clinical measurements (such as HbA1c, Fasting Glucose, Lipid Profile, and Blood Pressure). All text parsing runs inside your browser.
              </p>
            </div>
          )}

          {/* STATE 3: Extracting Text Progress */}
          {processingState === 'extracting' && (
            <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-950 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
                  <span>{uploadedFile.processingStatusMessage || 'Processing report...'}</span>
                </span>
                <span className="font-mono tabular-nums text-teal-800 font-bold">
                  {uploadedFile.processingProgress || 10}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-teal-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-700 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadedFile.processingProgress || 10}%` }}
                />
              </div>

              <p className="text-[11px] text-teal-800">
                {uploadedFile.type.includes('pdf')
                  ? 'Reading embedded digital text stream via PDF.js...'
                  : 'Analyzing image characters and contrast via browser Tesseract OCR...'}
              </p>
            </div>
          )}

          {/* STATE 4: No Readable Text Found */}
          {processingState === 'no-text-found' && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    {uploadedFile.isScannedPdf ? 'Scanned Image PDF Detected' : 'No Readable Text Found'}
                  </h4>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    {uploadedFile.errorMessage ||
                      'No legible characters could be extracted from this document.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={startReportExtraction}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Extraction</span>
                </button>
                <button
                  type="button"
                  onClick={removeUploadedFile}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
                >
                  Choose Another Document
                </button>
              </div>
            </div>
          )}

          {/* STATE 7: Processing Failed */}
          {processingState === 'failed' && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-950 text-sm">Processing Encountered an Error</h4>
                  <p className="mt-1 text-red-900 leading-relaxed">
                    {uploadedFile.errorMessage ||
                      'The extraction service encountered an issue while reading the document file format.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-red-200/80">
                <button
                  type="button"
                  onClick={startReportExtraction}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Processing</span>
                </button>
                <button
                  type="button"
                  onClick={removeUploadedFile}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel & Remove File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 5: Extracted — Awaiting Review */}
      {processingState === 'extracted-review' && uploadedFile && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Status banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Extracted — Needs Review
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {uploadedFile.extractedMeasurements.length} parameter{uploadedFile.extractedMeasurements.length === 1 ? '' : 's'} detected
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Mandatory User Confirmation of Laboratory Results
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Carefully review every detected metric against your physical report. You can edit names, values, units, reference intervals, or delete inaccuracies before confirming.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                <span>Add Measurement Manually</span>
              </button>
            </div>
          </div>

          {/* Clinical OCR Disclaimers */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-semibold text-amber-950">Clinical Verification Notice: </span>
              OCR and text parsers can misread decimal points (e.g., 5.7 vs 57), units, signs, or digit spacing. Never treat raw unconfirmed extraction output as verified medical data.
            </div>
          </div>

          {/* Editable Measurements Table */}
          {uploadedFile.extractedMeasurements.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
              <p className="font-semibold text-slate-800">No laboratory measurements were identified from the document text.</p>
              <p className="text-slate-500 mt-1">
                You can review the raw text below or click &quot;Add Measurement Manually&quot; to input test values.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-white border border-teal-300 rounded-lg hover:bg-teal-50"
              >
                Add Measurement
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Laboratory Measurement</th>
                    <th className="py-2.5 px-3 w-28">Value</th>
                    <th className="py-2.5 px-3 w-24">Unit</th>
                    <th className="py-2.5 px-3 w-36">Reference Range</th>
                    <th className="py-2.5 px-3">Context / Confidence</th>
                    <th className="py-2.5 px-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {uploadedFile.extractedMeasurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => updateExtractedMeasurement(m.id, { name: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-teal-600 outline-none text-xs"
                          placeholder="Measurement Name"
                        />
                      </td>

                      {/* Value input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={m.value}
                          onChange={(e) => updateExtractedMeasurement(m.id, { value: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 text-right focus:ring-1 focus:ring-teal-600 outline-none text-xs tabular-nums"
                          placeholder="Value"
                        />
                      </td>

                      {/* Unit input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={m.unit}
                          onChange={(e) => updateExtractedMeasurement(m.id, { unit: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-slate-700 focus:ring-1 focus:ring-teal-600 outline-none text-xs"
                          placeholder="e.g. mg/dL"
                        />
                      </td>

                      {/* Reference range input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={m.referenceRange}
                          onChange={(e) => updateExtractedMeasurement(m.id, { referenceRange: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-slate-700 focus:ring-1 focus:ring-teal-600 outline-none text-xs tabular-nums"
                          placeholder="e.g. < 200"
                        />
                      </td>

                      {/* Confidence & Snippet */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {m.confidence === 'high' && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              High Match
                            </span>
                          )}
                          {m.confidence === 'medium' && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Medium
                            </span>
                          )}
                          {m.confidence === 'needs-review' && (
                            <span className="text-[10px] font-semibold text-red-800 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                              Needs Review
                            </span>
                          )}
                          {m.isManuallyAdded && (
                            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">
                              Manual
                            </span>
                          )}
                          {m.isEdited && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              Edited
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono line-clamp-1 truncate max-w-xs" title={m.rawSnippet}>
                          {m.rawSnippet}
                        </p>
                      </td>

                      {/* Delete */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeExtractedMeasurement(m.id)}
                          className="p-1 text-slate-400 hover:text-red-700 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
                          title="Remove measurement"
                          aria-label={`Remove ${m.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Collapsible Raw Text Inspector */}
          {uploadedFile.rawExtractedText && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  <span>Inspect Source Document Extracted Text</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({uploadedFile.rawExtractedText.length} characters)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-teal-800 text-[11px]">
                  {showRawText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRawText ? 'Hide Raw Text' : 'View Raw Text'}</span>
                </div>
              </button>

              {showRawText && (
                <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text border-t border-slate-200">
                  {uploadedFile.rawExtractedText}
                </div>
              )}
            </div>
          )}

          {/* Action buttons: Confirm or Cancel */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Confirming marks reviewed laboratory values for this session.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={cancelReportExtraction}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                Cancel Without Saving
              </button>

              <button
                type="button"
                onClick={confirmMeasurements}
                disabled={uploadedFile.extractedMeasurements.length === 0}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Reviewed Results ({uploadedFile.extractedMeasurements.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 6: Results Reviewed and Confirmed */}
      {processingState === 'confirmed' && uploadedFile && (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Results Confirmed</span>
                </span>
                <span className="text-xs text-slate-500">
                  {uploadedFile.confirmedMeasurements.length} verified laboratory parameter{uploadedFile.confirmedMeasurements.length === 1 ? '' : 's'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Confirmed Laboratory Measurements
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                These reviewed figures are associated with <strong className="text-slate-800">{uploadedFile.name}</strong> for the duration of this session.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={reEditMeasurements}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Re-edit Measurements</span>
              </button>
            </div>
          </div>

          {/* Confirmed results table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Laboratory Analyte / Parameter</th>
                  <th className="py-2.5 px-3 text-right">Confirmed Value</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Reference Range</th>
                  <th className="py-2.5 px-3">Source Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {uploadedFile.confirmedMeasurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {m.value}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{m.unit || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px] tabular-nums">
                      {m.referenceRange || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono truncate max-w-xs" title={m.rawSnippet}>
                      {m.rawSnippet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Safety Reminder */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Medical Interpretation Notice: </span>
            NutriCare AI organizes these metrics for your personal reference and nutritional education. Laboratory measurements should always be evaluated in consultation with your primary physician or clinical specialist.
          </div>
        </div>
      )}

      {/* Manual Measurement Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Laboratory Measurement</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Measurement / Test Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. Hemoglobin A1c or Total Cholesterol"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Value <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.value}
                    onChange={(e) => setManualForm({ ...manualForm, value: e.target.value })}
                    placeholder="e.g. 5.8 or 215"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={manualForm.unit}
                    onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                    placeholder="e.g. % or mg/dL"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference Range (from printed report)
                </label>
                <input
                  type="text"
                  value={manualForm.referenceRange}
                  onChange={(e) => setManualForm({ ...manualForm, referenceRange: e.target.value })}
                  placeholder="e.g. < 5.7 or 70 - 99"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none tabular-nums"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
                >
                  Add to Review Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <DisclaimerNotice variant="card" />
    </div>
  );
};
