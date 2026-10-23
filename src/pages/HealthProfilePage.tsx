import React, { useState } from 'react';
import {
  HeartPulse,
  Save,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { HealthCondition, HealthProfile } from '../types';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Dairy & Lactose',
  'Gluten & Wheat',
  'Shellfish',
  'Fish',
  'Eggs',
  'Soy',
  'Sesame',
];

const DIETARY_PREFERENCES = [
  'Standard Balanced / Whole-Food',
  'Mediterranean-Style (Heart Healthy)',
  'DASH Pattern (Dietary Approaches to Stop Hypertension)',
  'Vegetarian (Lacto-Ovo)',
  'Plant-Based / Vegan',
  'Pescatarian (Seafood & Plant-Forward)',
  'Lower-Carbohydrate Focus',
];

export const HealthProfilePage: React.FC = () => {
  const { profile, saveProfile, addToast } = useNutriCare();

  const [formData, setFormData] = useState<HealthProfile>({ ...profile });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const toggleCondition = (cond: HealthCondition) => {
    setIsDirty(true);
    setValidationError(null);
    setFormData((prev) => {
      const exists = prev.conditions.includes(cond);
      const updated = exists
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond];
      return { ...prev, conditions: updated };
    });
  };

  const toggleAllergy = (allergy: string) => {
    setIsDirty(true);
    setFormData((prev) => {
      const exists = prev.foodAllergies.includes(allergy);
      const updated = exists
        ? prev.foodAllergies.filter((a) => a !== allergy)
        : [...prev.foodAllergies, allergy];
      return { ...prev, foodAllergies: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.conditions.length === 0) {
      setValidationError('Please select at least one health focus condition so NutriCare AI can tailor educational suggestions.');
      return;
    }
    setValidationError(null);
    saveProfile(formData);
    setIsDirty(false);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setIsDirty(false);
    setValidationError(null);
    addToast({
      type: 'info',
      title: 'Changes Discarded',
      message: 'Reverted form fields to the previously saved session configuration.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <span>Session Health Preferences</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Health & Dietary Profile</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Select your focus conditions and dietary habits. This configuration customizes meal
              suggestions and nutritional thresholds in the planner and scanner.
            </p>
          </div>

          <div className="hidden sm:block text-right shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80">
              Session Memory
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Local browser storage</p>
          </div>
        </div>

        {/* Informative notice on privacy & inference ban */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Shield className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Privacy & Clinical Safety Boundary</span>
          </div>
          <p className="leading-relaxed">
            NutriCare AI never solicits sensitive personally identifiable numbers (SSN, insurance, medical ID). Diagnoses are never automatically inferred or assigned from laboratory values; your selections here solely guide educational content.
          </p>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-950">Validation Notice</p>
            <p className="mt-0.5 text-red-800 leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Section 1: Conditions */}
        <div>
          <div className="mb-3">
            <label className="block text-sm font-bold text-slate-900">
              1. Health Focus Conditions <span className="text-teal-700">*</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Select one or more conditions you wish to align nutrition guidelines with.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Diabetes Checkbox Card */}
            <div
              onClick={() => toggleCondition('diabetes')}
              className={`cursor-pointer p-4 rounded-lg border text-left transition-all ${
                formData.conditions.includes('diabetes')
                  ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Diabetes</span>
                <input
                  type="checkbox"
                  checked={formData.conditions.includes('diabetes')}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Carbohydrate quality, low glycemic impact, fiber optimization.
              </p>
            </div>

            {/* High Cholesterol Checkbox Card */}
            <div
              onClick={() => toggleCondition('cholesterol')}
              className={`cursor-pointer p-4 rounded-lg border text-left transition-all ${
                formData.conditions.includes('cholesterol')
                  ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">High Cholesterol</span>
                <input
                  type="checkbox"
                  checked={formData.conditions.includes('cholesterol')}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Saturated fat reduction, plant sterols, soluble beta-glucan fiber.
              </p>
            </div>

            {/* Hypertension Checkbox Card */}
            <div
              onClick={() => toggleCondition('hypertension')}
              className={`cursor-pointer p-4 rounded-lg border text-left transition-all ${
                formData.conditions.includes('hypertension')
                  ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Hypertension</span>
                <input
                  type="checkbox"
                  checked={formData.conditions.includes('hypertension')}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sodium restriction (&lt; 2000mg/day), DASH principles, potassium balance.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Dietary Preference */}
        <div className="pt-6 border-t border-slate-100">
          <div className="mb-3">
            <label htmlFor="dietary-preference" className="block text-sm font-bold text-slate-900">
              2. General Dietary Preference <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your primary lifestyle eating pattern.
            </p>
          </div>

          <select
            id="dietary-preference"
            value={formData.dietaryPreference}
            onChange={(e) => {
              setIsDirty(true);
              setFormData((prev) => ({ ...prev, dietaryPreference: e.target.value }));
            }}
            className="w-full sm:max-w-md px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none"
          >
            <option value="">Select a dietary preference (optional)...</option>
            {DIETARY_PREFERENCES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>

        {/* Section 3: Allergies */}
        <div className="pt-6 border-t border-slate-100">
          <div className="mb-3">
            <label className="block text-sm font-bold text-slate-900">
              3. Food Allergies & Sensitivities <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Flag ingredients that should be filtered out from meal suggestions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ALLERGY_OPTIONS.map((allergy) => {
              const isSelected = formData.foodAllergies.includes(allergy);
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left border transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-50/80 border-red-300 text-red-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
                >
                  <span>{allergy}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-red-700" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Foods to Avoid & Meal Preferences */}
        <div className="pt-6 border-t border-slate-100 space-y-5">
          <div>
            <label htmlFor="foods-to-avoid" className="block text-sm font-bold text-slate-900">
              4. Specific Foods or Ingredients to Avoid <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter individual items separated by commas (e.g., canned soups, grapefruit, licorice, refined flour).
            </p>
            <input
              id="foods-to-avoid"
              type="text"
              value={formData.foodsToAvoid}
              onChange={(e) => {
                setIsDirty(true);
                setFormData((prev) => ({ ...prev, foodsToAvoid: e.target.value }));
              }}
              placeholder="e.g. Canned salted stocks, processed deli meats, high-fructose corn syrup"
              className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none"
            />
          </div>

          <div>
            <label htmlFor="meal-preferences" className="block text-sm font-bold text-slate-900">
              5. Meal Routine & Culinary Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Any personal preferences regarding preparation styles, meal frequency, or warm vs. cold dishes.
            </p>
            <textarea
              id="meal-preferences"
              rows={3}
              value={formData.mealPreferences}
              onChange={(e) => {
                setIsDirty(true);
                setFormData((prev) => ({ ...prev, mealPreferences: e.target.value }));
              }}
              placeholder="e.g. Prefer quick-prep breakfasts under 15 minutes, focus on legumes and leafy greens, avoid heavy dinners after 7 PM."
              className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {isDirty ? (
              <span className="text-amber-700 font-medium">Unsaved changes in current form</span>
            ) : profile.updatedAt ? (
              <span>Last saved at {profile.updatedAt} (Session Memory)</span>
            ) : (
              <span>No profile configured yet</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!isDirty}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Preferences</span>
            </button>
          </div>
        </div>
      </form>

      <DisclaimerNotice variant="card" />
    </div>
  );
};
