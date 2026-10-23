export type NavigationPage =
  | 'dashboard'
  | 'health-profile'
  | 'medical-reports'
  | 'nutrition-planner'
  | 'food-scanner'
  | 'history'
  | 'settings';

export type HealthCondition = 'diabetes' | 'cholesterol' | 'hypertension';

export interface HealthProfile {
  conditions: HealthCondition[];
  dietaryPreference: string;
  foodAllergies: string[];
  foodsToAvoid: string;
  mealPreferences: string;
  updatedAt?: string;
  isSaved: boolean;
}

export type ReportProcessingState =
  | 'no-report'
  | 'uploaded-unprocessed'
  | 'extracting'
  | 'no-text-found'
  | 'extracted-review'
  | 'confirmed'
  | 'failed';

export type ExtractionConfidence = 'high' | 'medium' | 'needs-review';

export interface ExtractedMeasurement {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  rawSnippet: string;
  confidence: ExtractionConfidence;
  isManuallyAdded?: boolean;
  isEdited?: boolean;
}

export interface UploadedFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File;
  objectUrl?: string;
  processingState: ReportProcessingState;
  processingProgress?: number;
  processingStatusMessage?: string;
  rawExtractedText?: string;
  extractedMeasurements: ExtractedMeasurement[];
  confirmedMeasurements: ExtractedMeasurement[];
  errorMessage?: string;
  isScannedPdf?: boolean;
  pageCount?: number;
}

export interface EducationalMeal {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  conditionFocus: HealthCondition[];
  description: string;
  nutritionalHighlights: {
    calories: number;
    carbs: number;
    fiber: number;
    protein: number;
    sodium: number;
    saturatedFat: number;
  };
  educationalRationale: string;
  ingredients: string[];
}

export interface RecipeNutrientEstimate {
  calories: number;
  carbs: number; // in g
  sugars: number; // in g
  fiber: number; // in g
  protein: number; // in g
  sodium: number; // in mg
  saturatedFat: number; // in g
  potassium?: number; // in mg
}

export interface PlannerRecipe {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryFrameworks: string[];
  conditionFocus: HealthCondition[];
  description: string;
  ingredients: string[];
  preparationSteps: string[];
  servingSize: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  estimatedNutrients: RecipeNutrientEstimate;
  allergens: string[];
  clinicalRationale: {
    diabetesRationale?: string;
    cholesterolRationale?: string;
    hypertensionRationale?: string;
    generalRationale: string;
  };
}

export interface RecipeRecommendation {
  recipe: PlannerRecipe;
  score: number;
  matchQuality: 'optimal' | 'favorable' | 'moderate' | 'neutral';
  matchingReasons: string[];
  tradeOffs: string[];
  labAlignmentNotes: string[];
  isProfilePersonalized: boolean;
}

export interface FilterExclusionSummary {
  allergenExcludedCount: number;
  avoidanceExcludedCount: number;
  frameworkExcludedCount: number;
  categoryExcludedCount: number;
  conditionExcludedCount: number;
  totalExcluded: number;
  excludedRecipeTitles: string[];
}

export type BarcodeLookupStatus =
  | 'idle'
  | 'loading'
  | 'found'
  | 'not-found'
  | 'incomplete'
  | 'error'
  | 'invalid-barcode';

export interface ProductNutrientData {
  energyKcal?: number;
  energyKj?: number;
  carbohydrates?: number;
  sugars?: number;
  saturatedFat?: number;
  fat?: number;
  sodium?: { value: number; unit: string };
  salt?: { value: number; unit: string };
  fiber?: number;
  protein?: number;
}

export interface NutritionProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  nutritionBasis: '100g' | 'serving';
  per100g?: ProductNutrientData;
  perServing?: ProductNutrientData;
  ingredients?: string;
  completeness?: number;
  isCompleteNutrition: boolean;
  missingNutrients: string[];
  dataSource: 'Open Food Facts' | 'Manual User Entry';
  lookupTimestamp?: string;
  isManual?: boolean;
}

export interface ActivityLogItem {
  id: string;
  type: 'upload' | 'profile' | 'nutrition' | 'scan' | 'settings';
  title: string;
  description: string;
  timestamp: string;
}

export interface AppSettings {
  glucoseUnit: 'mg/dL' | 'mmol/L';
  cholesterolUnit: 'mg/dL' | 'mmol/L';
  pressureUnit: 'mmHg';
  compactMode: boolean;
  highContrast: boolean;
}
