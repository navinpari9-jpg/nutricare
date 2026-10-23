import React, { useState, useMemo, useEffect } from 'react';
import {
  UtensilsCrossed,
  Filter,
  Search,
  X,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Heart,
  Droplet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  BookOpen,
  ArrowRight,
  ChefHat,
  RotateCcw,
} from 'lucide-react';
import { useNutriCare } from '../context/NutriCareContext';
import { HealthCondition, PlannerRecipe, RecipeRecommendation } from '../types';
import { getRecommendedRecipes } from '../services/nutritionPlannerService';
import { DisclaimerNotice } from '../components/layout/DisclaimerNotice';

const MEAL_CATEGORIES: { id: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks & Fuel' },
];

const DIETARY_FRAMEWORKS = [
  { id: 'all', label: 'All Frameworks' },
  { id: 'Standard Balanced / Whole-Food', label: 'Standard Balanced / Whole-Food' },
  { id: 'Mediterranean-Style (Heart Healthy)', label: 'Mediterranean-Style (Heart Healthy)' },
  { id: 'DASH Pattern (Dietary Approaches to Stop Hypertension)', label: 'DASH Pattern (Low Sodium)' },
  { id: 'Vegetarian (Lacto-Ovo)', label: 'Vegetarian (Lacto-Ovo)' },
  { id: 'Plant-Based / Vegan', label: 'Plant-Based / Vegan' },
  { id: 'Pescatarian (Seafood & Plant-Forward)', label: 'Pescatarian' },
  { id: 'Lower-Carbohydrate Focus', label: 'Lower-Carbohydrate Focus' },
];

export const NutritionPlannerPage: React.FC = () => {
  const { profile, uploadedFile, setActivePage } = useNutriCare();

  const confirmedLabs = useMemo(() => {
    return uploadedFile?.confirmedMeasurements || [];
  }, [uploadedFile]);

  // Filters state
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<PlannerRecipe | null>(null);

  // Synchronize initial framework with saved profile preference if set
  useEffect(() => {
    if (profile.dietaryPreference && selectedFramework === 'all') {
      setSelectedFramework(profile.dietaryPreference);
    }
  }, [profile.dietaryPreference]);

  // Compute recommendations deterministically
  const recommendationOutput = useMemo(() => {
    return getRecommendedRecipes(profile, confirmedLabs, {
      category: selectedCategory,
      condition: selectedCondition,
      dietaryFramework: selectedFramework,
      searchQuery: searchQuery,
    });
  }, [profile, confirmedLabs, selectedCategory, selectedCondition, selectedFramework, searchQuery]);

  // Dynamic category counts (evaluating against current allergen and avoidance rules)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    for (const cat of ['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const res = getRecommendedRecipes(profile, confirmedLabs, {
        category: cat,
        condition: selectedCondition,
        dietaryFramework: selectedFramework,
        searchQuery: searchQuery,
      });
      counts[cat] = res.recommendations.length;
    }
    return counts;
  }, [profile, confirmedLabs, selectedCondition, selectedFramework, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCondition('all');
    setSelectedCategory('all');
    setSelectedFramework('all');
    setSearchQuery('');
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedRecipeForDetail) {
        setSelectedRecipeForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecipeForDetail]);

  const hasActiveProfile = profile.conditions.length > 0;
  const hasActiveAllergies = profile.foodAllergies.length > 0;
  const hasActiveAvoidances = Boolean(profile.foodsToAvoid && profile.foodsToAvoid.trim());
  const hasConfirmedLabs = confirmedLabs.length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
              <UtensilsCrossed className="w-4 h-4 text-teal-700" />
              <span>Evidence-Informed Meal Guidance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Personalized Nutrition Planner
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
              Profile-aware meal suggestions powered by transparent, deterministic nutritional rules.
              Meals are evaluated against your active health conditions, verified allergen restrictions, and confirmed lab measurements.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <span
              className={`text-xs px-2.5 py-1 rounded font-medium border ${
                recommendationOutput.isProfilePersonalized
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {recommendationOutput.isProfilePersonalized
                ? 'Profile-Personalized'
                : 'General Educational Library'}
            </span>
            <span className="text-[11px] text-slate-400">Deterministic rule-based</span>
          </div>
        </div>

        {/* Safety Boundary Notice */}
        <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Educational Reference Only: </span>
            The nutritional ideas below are educational meal compositions based on general nutritional principles. NutriCare AI does not diagnose, prescribe, or provide medical treatment. All nutrient numbers are estimates based on standard recipes; actual values vary with brands and preparation. Always consult your physician or registered dietitian before making significant dietary changes.
          </p>
        </div>
      </div>

      {/* Active Profile & Safety Context Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active Session Profile & Safety Filters
            </h2>
          </div>
          <button
            onClick={() => setActivePage('health-profile')}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
          >
            <span>Edit Profile</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Conditions */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
              Health Focus
            </span>
            {hasActiveProfile ? (
              <div className="flex flex-wrap gap-1">
                {profile.conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 font-semibold text-teal-900 capitalize text-xs"
                  >
                    {c === 'diabetes' && <Droplet className="w-3 h-3 text-teal-600" />}
                    {c === 'cholesterol' && <Heart className="w-3 h-3 text-rose-500" />}
                    {c === 'hypertension' && <Activity className="w-3 h-3 text-blue-600" />}
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic">None selected (Showing general whole foods)</span>
            )}
          </div>

          {/* Allergies (Strict Safety) */}
          <div
            className={`p-3 rounded-lg border ${
              hasActiveAllergies
                ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}
          >
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
              Food Allergies (Strict Exclusion)
            </span>
            {hasActiveAllergies ? (
              <div className="font-semibold text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{profile.foodAllergies.join(', ')}</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">No allergies declared</span>
            )}
          </div>

          {/* Dietary Framework */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
              Dietary Framework
            </span>
            <span className="font-semibold text-slate-800 truncate block">
              {profile.dietaryPreference || 'Standard Balanced / Whole-Food'}
            </span>
          </div>

          {/* Confirmed Lab Measurements */}
          <div
            className={`p-3 rounded-lg border ${
              hasConfirmedLabs
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}
          >
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
              Confirmed Lab Values
            </span>
            {hasConfirmedLabs ? (
              <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{confirmedLabs.length} confirmed biomarker(s)</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">No report confirmed yet</span>
            )}
          </div>
        </div>

        {hasActiveAvoidances && (
          <div className="text-[11px] text-slate-600 bg-amber-50/50 border border-amber-200/70 p-2 rounded-lg flex items-center gap-1.5">
            <span className="font-semibold text-amber-900">Custom Avoided Ingredients:</span>
            <span>{profile.foodsToAvoid}</span>
          </div>
        )}
      </div>

      {/* Interactive Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        {/* Search & Framework row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-2 relative">
            <label htmlFor="recipe-search" className="sr-only">
              Search recipes or ingredients
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="recipe-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, ingredients (e.g., oats, spinach, salmon, makhana)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dietary Framework Dropdown */}
          <div>
            <label htmlFor="framework-select" className="sr-only">
              Dietary Framework
            </label>
            <select
              id="framework-select"
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {DIETARY_FRAMEWORKS.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition Filter & Category Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1 border-t border-slate-100">
          {/* Category Tabs */}
          <div className="lg:col-span-7">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meal Category
            </span>
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
              {MEAL_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id];
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-teal-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-bold'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="lg:col-span-5">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Condition Focus Filter
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedCondition('all')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                  selectedCondition === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('diabetes')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                  selectedCondition === 'diabetes'
                    ? 'bg-white text-teal-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                Diabetes
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('cholesterol')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                  selectedCondition === 'cholesterol'
                    ? 'bg-white text-teal-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                Lipids
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('hypertension')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                  selectedCondition === 'hypertension'
                    ? 'bg-white text-teal-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none`}
              >
                DASH / BP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Recommendations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {recommendationOutput.isProfilePersonalized
                ? `Personalized Meal Recommendations (${recommendationOutput.recommendations.length})`
                : `General Educational Whole-Food Recipes (${recommendationOutput.recommendations.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {recommendationOutput.isProfilePersonalized
                ? 'Sorted deterministically by nutritional alignment with your profile'
                : 'Educational library templates; configure health profile for personalized ranking'}
            </p>
          </div>

          {(selectedCondition !== 'all' || selectedCategory !== 'all' || selectedFramework !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Empty State / Zero Results */}
        {recommendationOutput.recommendations.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              No recipes match your active filter combination
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              We screened all {recommendationOutput.totalAvailable} recipes in the local dataset.
              Some recipes were safely excluded to honor your safety restrictions:
            </p>

            {/* Breakdown of exclusions */}
            <div className="max-w-md mx-auto bg-slate-50 p-3 rounded-lg border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
              {recommendationOutput.exclusionSummary.allergenExcludedCount > 0 && (
                <div className="flex items-center gap-2 text-rose-800 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    {recommendationOutput.exclusionSummary.allergenExcludedCount} excluded to protect against declared allergies ({profile.foodAllergies.join(', ')})
                  </span>
                </div>
              )}
              {recommendationOutput.exclusionSummary.avoidanceExcludedCount > 0 && (
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {recommendationOutput.exclusionSummary.avoidanceExcludedCount} excluded due to avoided ingredients ("{profile.foodsToAvoid}")
                  </span>
                </div>
              )}
              {recommendationOutput.exclusionSummary.frameworkExcludedCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>
                    {recommendationOutput.exclusionSummary.frameworkExcludedCount} excluded by dietary framework ({selectedFramework})
                  </span>
                </div>
              )}
              {recommendationOutput.exclusionSummary.categoryExcludedCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>
                    Excluded by meal category ({selectedCategory})
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-2xs transition-colors"
              >
                Reset Non-Allergen Filters
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                Your declared allergen protections will remain strictly enforced.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendationOutput.recommendations.map((rec) => {
              const { recipe, matchQuality, matchingReasons, tradeOffs, labAlignmentNotes } = rec;
              const nutrients = recipe.estimatedNutrients;

              return (
                <div
                  key={recipe.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category + Quality Badge */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-teal-800 uppercase tracking-wider text-[10px] bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded">
                          {recipe.category}
                        </span>
                        {recipe.conditionFocus.map((cf) => (
                          <span
                            key={cf}
                            className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium capitalize"
                          >
                            {cf}
                          </span>
                        ))}
                      </div>

                      {/* Match Tier Badge */}
                      {recommendationOutput.isProfilePersonalized ? (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            matchQuality === 'optimal'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : matchQuality === 'favorable'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {matchQuality === 'optimal'
                            ? 'Optimal Match'
                            : matchQuality === 'favorable'
                            ? 'High Alignment'
                            : 'Favorable'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-medium">
                          Educational Template
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {recipe.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                        {recipe.description}
                      </p>
                    </div>

                    {/* Prep & Serving Info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins total</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Serves: {recipe.servingSize}</span>
                    </div>

                    {/* Estimated Nutrients Grid */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Calories</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-800">
                            {nutrients.calories}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Carbs</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-800">
                            {nutrients.carbs}g
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Fiber</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-teal-800 font-semibold">
                            {nutrients.fiber}g
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Protein</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-800">
                            {nutrients.protein}g
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Sodium</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-800">
                            {nutrients.sodium}mg
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Sat Fat</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-800">
                            {nutrients.saturatedFat}g
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                        *Estimated values · Actual nutrition varies by brand & cooking method
                      </p>
                    </div>

                    {/* Matching Rationale Highlights */}
                    {matchingReasons.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-slate-800 block">
                          Nutritional Alignment:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {matchingReasons.slice(0, 2).map((reason, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Trade-Off Alert (if applicable) */}
                    {tradeOffs.length > 0 && (
                      <div className="p-2 bg-amber-50/60 border border-amber-200/70 rounded-lg text-xs text-amber-900 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-snug text-[11px]">
                          <span className="font-semibold">Trade-Off: </span>
                          <span>{tradeOffs[0]}</span>
                        </div>
                      </div>
                    )}

                    {/* Confirmed Lab Alignment Note */}
                    {labAlignmentNotes.length > 0 && (
                      <div className="p-2 bg-blue-50/60 border border-blue-200/70 rounded-lg text-xs text-blue-900 flex items-start gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="leading-snug text-[11px]">
                          <span>{labAlignmentNotes[0]}</span>
                        </div>
                      </div>
                    )}

                    {/* Allergen verification notice */}
                    <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
                      {hasActiveAllergies ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Screened: Free of your declared allergies</span>
                        </span>
                      ) : (
                        <span>
                          {recipe.allergens.length > 0
                            ? `Contains: ${recipe.allergens.join(', ')}`
                            : 'No standard allergens'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Details Action Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRecipeForDetail(recipe)}
                    className="mt-4 pt-3 border-t border-slate-100 w-full text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none"
                  >
                    <span>View Ingredients & Preparation Steps</span>
                    <ChevronRight className="w-4 h-4 text-teal-700" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal / Drawer */}
      {selectedRecipeForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-recipe-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setSelectedRecipeForDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-semibold text-teal-800 uppercase tracking-wider text-[10px] bg-teal-50 px-2 py-0.5 rounded">
                    {selectedRecipeForDetail.category}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 text-xs">
                    Serves: {selectedRecipeForDetail.servingSize}
                  </span>
                </div>
                <h2 id="modal-recipe-title" className="text-lg font-bold text-slate-900">
                  {selectedRecipeForDetail.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedRecipeForDetail.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecipeForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preparation Times */}
            <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prep Time</span>
                <span className="font-bold text-slate-800">{selectedRecipeForDetail.prepTimeMinutes} mins</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cook Time</span>
                <span className="font-bold text-slate-800">{selectedRecipeForDetail.cookTimeMinutes} mins</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Time</span>
                <span className="font-bold text-teal-800">
                  {selectedRecipeForDetail.prepTimeMinutes + selectedRecipeForDetail.cookTimeMinutes} mins
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Serving Size</span>
                <span className="font-bold text-slate-800">{selectedRecipeForDetail.servingSize}</span>
              </div>
            </div>

            {/* Estimated Nutrients Breakdown */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Estimated Nutritional Breakdown per Serving
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Calories</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.calories} kcal
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Total Carbs</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.carbs}g
                  </span>
                </div>
                <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                  <span className="text-[10px] text-teal-800 block font-medium">Dietary Fiber</span>
                  <span className="font-mono font-bold text-teal-900">
                    {selectedRecipeForDetail.estimatedNutrients.fiber}g
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Simple Sugars</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.sugars}g
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Protein</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.protein}g
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Sodium</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.sodium}mg
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Saturated Fat</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedRecipeForDetail.estimatedNutrients.saturatedFat}g
                  </span>
                </div>
                {selectedRecipeForDetail.estimatedNutrients.potassium && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Potassium</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedRecipeForDetail.estimatedNutrients.potassium}mg
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 italic">
                Values are estimated based on standard whole-food preparation. Actual values vary with specific ingredient brands, cooking techniques, and portion sizes.
              </p>
            </div>

            {/* Ingredients List */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-teal-700" />
                <span>Ingredients</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedRecipeForDetail.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preparation Steps */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>Step-by-Step Preparation</span>
              </h3>
              <ol className="space-y-2.5 text-xs text-slate-700">
                {selectedRecipeForDetail.preparationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Clinical & Nutritional Rationale */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Nutritional Rationale & Evidence
              </h3>
              <div className="space-y-2 text-xs">
                {selectedRecipeForDetail.clinicalRationale.diabetesRationale && (
                  <div className="p-2.5 bg-teal-50/40 rounded border border-teal-100/60 text-slate-700 leading-relaxed">
                    <span className="font-semibold text-teal-900">Glycemic & Diabetes Rationale: </span>
                    {selectedRecipeForDetail.clinicalRationale.diabetesRationale}
                  </div>
                )}
                {selectedRecipeForDetail.clinicalRationale.cholesterolRationale && (
                  <div className="p-2.5 bg-rose-50/40 rounded border border-rose-100/60 text-slate-700 leading-relaxed">
                    <span className="font-semibold text-rose-900">Lipid & Cholesterol Rationale: </span>
                    {selectedRecipeForDetail.clinicalRationale.cholesterolRationale}
                  </div>
                )}
                {selectedRecipeForDetail.clinicalRationale.hypertensionRationale && (
                  <div className="p-2.5 bg-blue-50/40 rounded border border-blue-100/60 text-slate-700 leading-relaxed">
                    <span className="font-semibold text-blue-900">DASH & Blood Pressure Rationale: </span>
                    {selectedRecipeForDetail.clinicalRationale.hypertensionRationale}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecipeForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                Close Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety & Educational Disclaimer */}
      <DisclaimerNotice variant="card" />
    </div>
  );
};
