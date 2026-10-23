import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode,
  Search,
  PlusCircle,
  Info,
  Package,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { NutritionProduct, BarcodeLookupStatus } from '../types';
import { lookupProductByBarcode, validateBarcode } from '../services/openFoodFactsService';
import { generateNutritionExplanations } from '../services/nutritionExplanationService';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

export const FoodScannerPage: React.FC = () => {
  const { activeProduct, setActiveProduct, profile, addActivity, addToast } = useNutriCare();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [lookupStatus, setLookupStatus] = useState<BarcodeLookupStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchedBarcode, setSearchedBarcode] = useState<string | null>(null);
  const [activeBasis, setActiveBasis] = useState<'100g' | 'serving'>('serving');
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: '',
    brand: '',
    servingSize: '1 serving (100g)',
    carbs: '',
    sugars: '',
    saturatedFat: '',
    sodium: '',
    salt: '',
    fiber: '',
    protein: '',
    energyKcal: '',
    ingredients: '',
  });

  // Track in-flight request to allow aborting or preventing stale race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update basis when activeProduct changes
  useEffect(() => {
    if (activeProduct) {
      setActiveBasis(activeProduct.nutritionBasis || '100g');
    }
  }, [activeProduct]);

  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submission while loading
    if (lookupStatus === 'loading') return;

    const trimmed = barcodeInput.trim();
    if (!trimmed) {
      setLookupStatus('invalid-barcode');
      setErrorMessage('Please enter a barcode number before searching.');
      return;
    }

    // Client-side barcode validation
    const validation = validateBarcode(trimmed);
    if (!validation.isValid) {
      setLookupStatus('invalid-barcode');
      setErrorMessage(validation.errorMessage || 'Invalid barcode format.');
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const barcode = validation.cleanedBarcode;
    setSearchedBarcode(barcode);
    setLookupStatus('loading');
    setErrorMessage(null);

    const result = await lookupProductByBarcode(barcode, abortController.signal);

    // If cancelled, do nothing
    if (abortController.signal.aborted) {
      return;
    }

    if (result.success && result.product) {
      const prod = result.product;
      setActiveProduct(prod);

      if (prod.isCompleteNutrition) {
        setLookupStatus('found');
      } else {
        setLookupStatus('incomplete');
      }

      addActivity({
        type: 'scan',
        title: `Product Found: ${prod.name}`,
        description: `Barcode ${prod.barcode} retrieved from Open Food Facts.`,
      });

      addToast({
        type: 'success',
        title: 'Product Found',
        message: `Retrieved "${prod.name}" from Open Food Facts.`,
      });
    } else {
      setActiveProduct(null);
      if (result.status === 'not-found') {
        setLookupStatus('not-found');
        setErrorMessage(result.errorMessage || `No product data available for this barcode.`);
      } else {
        setLookupStatus('error');
        setErrorMessage(result.errorMessage || 'Failed to retrieve product data. Check connection and retry.');
      }
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a product name before saving manual details.',
      });
      return;
    }

    const parseOptNum = (s: string) => {
      const trimmed = s.trim();
      if (!trimmed) return undefined;
      const num = parseFloat(trimmed);
      return Number.isFinite(num) ? num : undefined;
    };

    const carbsVal = parseOptNum(manualForm.carbs);
    const sugarsVal = parseOptNum(manualForm.sugars);
    const satFatVal = parseOptNum(manualForm.saturatedFat);
    const sodiumVal = parseOptNum(manualForm.sodium);
    const saltVal = parseOptNum(manualForm.salt);
    const fiberVal = parseOptNum(manualForm.fiber);
    const proteinVal = parseOptNum(manualForm.protein);
    const kcalVal = parseOptNum(manualForm.energyKcal);

    const missing: string[] = [];
    if (carbsVal === undefined) missing.push('Total Carbohydrates');
    if (sugarsVal === undefined) missing.push('Total Sugars');
    if (satFatVal === undefined) missing.push('Saturated Fat');
    if (sodiumVal === undefined && saltVal === undefined) missing.push('Sodium / Salt');

    const created: NutritionProduct = {
      barcode: barcodeInput.trim() || 'MANUAL-' + Math.floor(100000 + Math.random() * 900000),
      name: manualForm.name.trim(),
      brand: manualForm.brand.trim() || undefined,
      servingSize: manualForm.servingSize.trim() || '1 serving',
      nutritionBasis: 'serving',
      perServing: {
        energyKcal: kcalVal,
        carbohydrates: carbsVal,
        sugars: sugarsVal,
        saturatedFat: satFatVal,
        sodium: sodiumVal !== undefined ? { value: sodiumVal, unit: 'mg' } : undefined,
        salt: saltVal !== undefined ? { value: saltVal, unit: 'g' } : undefined,
        fiber: fiberVal,
        protein: proteinVal,
      },
      per100g: undefined,
      ingredients: manualForm.ingredients.trim() || undefined,
      isCompleteNutrition: missing.length === 0,
      missingNutrients: missing,
      dataSource: 'Manual User Entry',
      lookupTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isManual: true,
    };

    setActiveProduct(created);
    setShowManualForm(false);
    setLookupStatus('found');
    setErrorMessage(null);

    addActivity({
      type: 'scan',
      title: `Manual Food Entry: ${created.name}`,
      description: 'Entered nutrition facts manually in session.',
    });

    addToast({
      type: 'success',
      title: 'Manual Nutrition Entry Recorded',
      message: `Recorded "${created.name}" for educational review.`,
    });
  };

  // Resolve current active nutrient data based on active basis
  const currentNutrients = activeProduct
    ? activeBasis === 'serving' && activeProduct.perServing
      ? activeProduct.perServing
      : activeProduct.per100g || activeProduct.perServing
    : undefined;

  const hasBothBases =
    activeProduct &&
    activeProduct.perServing !== undefined &&
    activeProduct.per100g !== undefined;

  // Generate health explanations based on saved profile
  const healthExplanations = activeProduct
    ? generateNutritionExplanations(activeProduct, profile.conditions, activeBasis)
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <Barcode className="w-4 h-4 text-teal-700" />
              <span>Real Product Database Lookup</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Food Scanner & Nutrition Facts</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Query real packaged food data from the public Open Food Facts database by barcode, or enter
              Nutrition Facts manually to evaluate carbohydrate, lipid, and sodium profiles.
            </p>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded font-medium">
              Open Food Facts v2
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Live Public Database</p>
          </div>
        </div>
      </div>

      {/* Barcode Search Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Search Product by Barcode</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter an 8 to 14-digit UPC, EAN, or GTIN barcode to retrieve verified product nutrition information.
          </p>
        </div>

        <form onSubmit={handleBarcodeSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={barcodeInput}
              disabled={lookupStatus === 'loading'}
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                if (lookupStatus === 'invalid-barcode') setLookupStatus('idle');
              }}
              placeholder="e.g. 737628064502 or 3017620422003"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            disabled={lookupStatus === 'loading'}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none shrink-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
          >
            {lookupStatus === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Database...</span>
              </>
            ) : (
              <>
                <Barcode className="w-4 h-4" />
                <span>Lookup Barcode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-teal-700" />
            <span>{showManualForm ? 'Close Manual Form' : 'Enter Details Manually'}</span>
          </button>
        </form>

        {/* State: Invalid Barcode Format */}
        {lookupStatus === 'invalid-barcode' && errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-950">Invalid Barcode</p>
              <p className="mt-0.5 text-red-800 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* State: Loading Indicator */}
        {lookupStatus === 'loading' && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-teal-700 animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-teal-950">Querying Open Food Facts API</p>
              <p className="text-teal-800 text-[11px] mt-0.5">
                Fetching product record for barcode <span className="font-mono font-bold">{searchedBarcode}</span>...
              </p>
            </div>
          </div>
        )}

        {/* State: Product Not Found */}
        {lookupStatus === 'not-found' && searchedBarcode && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">No product data available for this barcode.</p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  Barcode <span className="font-mono font-semibold">{searchedBarcode}</span> was not found in the Open Food Facts public repository. NutriCare AI never fabricates missing food records or substitutes random products.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Enter Nutrition Facts Manually
              </button>
            </div>
          </div>
        )}

        {/* State: Network or API Error */}
        {lookupStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-950">Lookup Error</p>
                <p className="mt-0.5 text-red-800 leading-relaxed">
                  {errorMessage || 'Unable to communicate with the Open Food Facts API.'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-red-200/80 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBarcodeSearch}
                className="px-3 py-1.5 text-xs font-semibold text-red-900 bg-white border border-red-300 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Lookup</span>
              </button>
            </div>
          </div>
        )}

        {/* State: Product Incomplete Notice */}
        {lookupStatus === 'incomplete' && activeProduct && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-950">Partial Nutrition Data: </span>
              This Open Food Facts record is missing values for:{' '}
              <strong className="text-amber-900">{activeProduct.missingNutrients.join(', ')}</strong>.
              Missing nutrients are displayed as &quot;Not reported&quot; rather than assumed to be zero.
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Form Collapsible */}
      {showManualForm && (
        <form
          onSubmit={handleManualFormSubmit}
          className="bg-white border border-teal-200 rounded-xl p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manual Nutrition Facts Entry</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Type the values printed directly on the Nutrition Facts label of your package.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Manual Form
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                placeholder="e.g. Whole Grain Sourdough"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer (Optional)
              </label>
              <input
                type="text"
                value={manualForm.brand}
                onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                placeholder="e.g. Artisan Bakery"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serving Size (Optional)
              </label>
              <input
                type="text"
                value={manualForm.servingSize}
                onChange={(e) => setManualForm({ ...manualForm, servingSize: e.target.value })}
                placeholder="e.g. 1 slice (50g)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Energy (Calories / kcal)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={manualForm.energyKcal}
                onChange={(e) => setManualForm({ ...manualForm, energyKcal: e.target.value })}
                placeholder="e.g. 150"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Carbs (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualForm.carbs}
                onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                placeholder="e.g. 28"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Sugars (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualForm.sugars}
                onChange={(e) => setManualForm({ ...manualForm, sugars: e.target.value })}
                placeholder="e.g. 1.5"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dietary Fiber (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualForm.fiber}
                onChange={(e) => setManualForm({ ...manualForm, fiber: e.target.value })}
                placeholder="e.g. 3.0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saturated Fat (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualForm.saturatedFat}
                onChange={(e) => setManualForm({ ...manualForm, saturatedFat: e.target.value })}
                placeholder="e.g. 0.5"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sodium (mg)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={manualForm.sodium}
                onChange={(e) => setManualForm({ ...manualForm, sodium: e.target.value })}
                placeholder="e.g. 140"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salt (g, if on label)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualForm.salt}
                onChange={(e) => setManualForm({ ...manualForm, salt: e.target.value })}
                placeholder="e.g. 0.35"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualForm.protein}
                onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                placeholder="e.g. 6.0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ingredients List (Optional)
            </label>
            <textarea
              rows={2}
              value={manualForm.ingredients}
              onChange={(e) => setManualForm({ ...manualForm, ingredients: e.target.value })}
              placeholder="e.g. Organic wheat flour, water, sea salt, sourdough starter culture."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-2xs"
            >
              Apply Manual Nutrition Facts
            </button>
          </div>
        </form>
      )}

      {/* Product Information Panel */}
      {activeProduct ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-4">
              {activeProduct.imageUrl ? (
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    activeProduct.isManual
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {activeProduct.dataSource}
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    Barcode: {activeProduct.barcode}
                  </span>
                  {activeProduct.isCompleteNutrition ? (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Complete Facts
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Partial Facts
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5 leading-snug break-words">
                  {activeProduct.name}
                </h2>

                {activeProduct.brand && (
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{activeProduct.brand}</p>
                )}

                <p className="text-[11px] text-slate-400 mt-1">
                  Retrieved at {activeProduct.lookupTimestamp} · {activeProduct.dataSource}
                </p>
              </div>
            </div>

            {/* Serving Size Info */}
            <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Serving Size:</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {activeProduct.servingSize || 'Not specified on package'}
              </p>
            </div>
          </div>

          {/* Basis Selector Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="font-semibold">Display Nutrient Basis:</span>
              <span className="text-slate-500 text-[11px]">
                {activeBasis === 'serving'
                  ? `Showing values per serving (${activeProduct.servingSize || 'serving'})`
                  : 'Showing values per 100 grams / 100 ml'}
              </span>
            </div>

            {hasBothBases && (
              <div className="flex items-center p-1 bg-white rounded-md border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveBasis('serving')}
                  className={`px-3 py-1 font-semibold rounded transition-colors ${
                    activeBasis === 'serving'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Serving
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBasis('100g')}
                  className={`px-3 py-1 font-semibold rounded transition-colors ${
                    activeBasis === '100g'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per 100g
                </button>
              </div>
            )}
          </div>

          {/* Key Nutritional Metrics Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Nutritional Facts Breakdown ({activeBasis === 'serving' ? 'Per Serving' : 'Per 100g'})
              </h3>
              <span className="text-[11px] text-slate-400">
                Source values preserved directly
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 block">Energy / Calories</span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {currentNutrients?.energyKcal !== undefined
                    ? `${currentNutrients.energyKcal.toLocaleString()} kcal`
                    : 'Not reported'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {currentNutrients?.energyKj !== undefined
                    ? `(${currentNutrients.energyKj.toLocaleString()} kJ)`
                    : 'Direct label figure'}
                </span>
              </div>

              {/* Carbohydrates */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 block">Total Carbohydrates</span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {currentNutrients?.carbohydrates !== undefined
                    ? `${currentNutrients.carbohydrates.toLocaleString()} g`
                    : 'Not reported'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Sugars: {currentNutrients?.sugars !== undefined ? `${currentNutrients.sugars} g` : 'Not reported'}
                </span>
              </div>

              {/* Saturated Fat */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 block">Saturated Fat</span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {currentNutrients?.saturatedFat !== undefined
                    ? `${currentNutrients.saturatedFat.toLocaleString()} g`
                    : 'Not reported'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Total fat: {currentNutrients?.fat !== undefined ? `${currentNutrients.fat} g` : 'Not reported'}
                </span>
              </div>

              {/* Sodium / Salt */}
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 block">
                  {currentNutrients?.sodium ? 'Sodium' : (currentNutrients?.salt ? 'Salt' : 'Sodium / Salt')}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {currentNutrients?.sodium ? (
                    `${currentNutrients.sodium.value} ${currentNutrients.sodium.unit}`
                  ) : currentNutrients?.salt ? (
                    `${currentNutrients.salt.value} ${currentNutrients.salt.unit}`
                  ) : (
                    'Not reported'
                  )}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {currentNutrients?.sodium && currentNutrients.sodium.unit.toLowerCase() === 'g' ? (
                    `approx. ${Math.round(currentNutrients.sodium.value * 1000)} mg`
                  ) : currentNutrients?.salt ? (
                    `approx. ${Math.round((currentNutrients.salt.value / 2.5) * 1000)} mg sodium`
                  ) : (
                    'Blood pressure factor'
                  )}
                </span>
              </div>
            </div>

            {/* Secondary row for Fiber and Protein */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="text-slate-500">Dietary Fiber:</span>
                <span className="font-mono font-bold text-teal-800 tabular-nums">
                  {currentNutrients?.fiber !== undefined ? `${currentNutrients.fiber} g` : 'Not reported'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="text-slate-500">Protein:</span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  {currentNutrients?.protein !== undefined ? `${currentNutrients.protein} g` : 'Not reported'}
                </span>
              </div>
            </div>
          </div>

          {/* Ingredients list */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Ingredients</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 select-text">
              {activeProduct.ingredients || 'No ingredients listed in this product record.'}
            </p>
          </div>

          {/* Health-Condition-Aware Educational Explanations Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Health-Condition Educational Considerations
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Educational observations grounded strictly in actual reported values and your saved health profile.
                </p>
              </div>
              <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {profile.conditions.length > 0 ? `${profile.conditions.length} Active Condition(s)` : 'General Profile'}
              </span>
            </div>

            <div className="space-y-3">
              {healthExplanations.map((exp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                    exp.hasRelevantData
                      ? 'bg-teal-50/40 border-teal-200/80 text-teal-950'
                      : 'bg-amber-50/50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{exp.title}</span>
                    {exp.hasRelevantData ? (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-white border border-emerald-200 px-1.5 py-0.2 rounded">
                        Data Analyzed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-white border border-amber-300 px-1.5 py-0.2 rounded">
                        Missing Data
                      </span>
                    )}
                  </div>

                  <p className={exp.hasRelevantData ? 'text-slate-700' : 'text-amber-900'}>
                    {exp.explanation}
                  </p>

                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                    {exp.guidelineContext}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Transparency Notice */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-800">Database Record Transparency: </strong>
              Product records are provided via Open Food Facts and user contributions. Packaging, formulation, or serving sizes may change over time. NutriCare AI presents nutrition facts objectively and does not diagnose, prescribe, or declare products universally safe or unsafe.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Product Data Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Scan an 8 to 14-digit barcode above to query Open Food Facts, or click &quot;Enter Details Manually&quot; to inspect custom nutrition facts.
          </p>
        </div>
      )}

      <DisclaimerNotice variant="card" />
    </div>
  );
};
