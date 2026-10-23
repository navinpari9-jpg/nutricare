import {
  PlannerRecipe,
  RecipeRecommendation,
  HealthProfile,
  HealthCondition,
  ExtractedMeasurement,
  FilterExclusionSummary,
} from '../types';
import { LOCAL_RECIPES_DATA } from '../data/recipesData';

export interface PlannerFilterCriteria {
  category?: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
  condition?: HealthCondition | 'all';
  dietaryFramework?: string | 'all';
  searchQuery?: string;
}

export interface RecommendationOutput {
  recommendations: RecipeRecommendation[];
  exclusionSummary: FilterExclusionSummary;
  totalAvailable: number;
  isProfilePersonalized: boolean;
  activeProfileConditions: HealthCondition[];
  activeAllergens: string[];
  activeAvoidances: string[];
  hasConfirmedLabs: boolean;
}

/**
 * Allergen keyword mapping for thorough checking across ingredients and allergen tags
 */
const ALLERGEN_KEYWORD_MAP: Record<string, string[]> = {
  'peanuts': ['peanut', 'groundnut'],
  'tree nuts': ['walnut', 'almond', 'cashew', 'pistachio', 'pecan', 'hazelnut', 'macadamia', 'brazil nut'],
  'dairy & lactose': ['dairy', 'lactose', 'milk', 'cheese', 'paneer', 'yogurt', 'curd', 'butter', 'ghee', 'cream', 'whey'],
  'gluten & wheat': ['gluten', 'wheat', 'roti', 'bread', 'barley', 'rye', 'spelt', 'semolina', 'suji', 'maida'],
  'shellfish': ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster'],
  'fish': ['fish', 'salmon', 'tuna', 'cod', 'mackerel', 'sardine', 'tilapia', 'halibut', 'anchovy'],
  'eggs': ['egg', 'eggs', 'yolk', 'albumin', 'mayonnaise'],
  'soy': ['soy', 'soya', 'tofu', 'edamame', 'tamari', 'miso', 'tempeh', 'soy sauce', 'soy milk'],
  'sesame': ['sesame', 'tahini', 'til'],
};

/**
 * Tests if a recipe contains any of the user's declared food allergies.
 * STRICT ZERO-TOLERANCE: Checks declared allergen tags and deep ingredient strings.
 */
export function recipeContainsAllergen(recipe: PlannerRecipe, declaredAllergies: string[]): { contains: boolean; matchedAllergen?: string } {
  if (!declaredAllergies || declaredAllergies.length === 0) {
    return { contains: false };
  }

  for (const allergy of declaredAllergies) {
    const cleanAllergy = allergy.trim().toLowerCase();
    if (!cleanAllergy) continue;

    // 1. Direct match with recipe allergens list
    for (const recipeAllergen of recipe.allergens) {
      if (recipeAllergen.toLowerCase().includes(cleanAllergy) || cleanAllergy.includes(recipeAllergen.toLowerCase())) {
        return { contains: true, matchedAllergen: allergy };
      }
    }

    // 2. Keyword check using dictionary
    const keywords = ALLERGEN_KEYWORD_MAP[cleanAllergy] || [cleanAllergy];
    
    // Check recipe's allergens list against keywords
    for (const kw of keywords) {
      if (recipe.allergens.some(a => a.toLowerCase().includes(kw))) {
        return { contains: true, matchedAllergen: allergy };
      }
    }

    // Check recipe's ingredients text
    for (const ingredient of recipe.ingredients) {
      const ingLower = ingredient.toLowerCase();
      for (const kw of keywords) {
        // Match whole word or bounded token
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(ingLower)) {
          return { contains: true, matchedAllergen: allergy };
        }
      }
    }
  }

  return { contains: false };
}

/**
 * Tests if a recipe contains user-defined foods or ingredients to avoid.
 */
export function recipeContainsAvoidedFood(recipe: PlannerRecipe, foodsToAvoidRaw: string): { contains: boolean; matchedFood?: string } {
  if (!foodsToAvoidRaw || !foodsToAvoidRaw.trim()) {
    return { contains: false };
  }

  const avoidList = foodsToAvoidRaw
    .split(/[,;\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 1);

  for (const avoidedItem of avoidList) {
    // Check in title
    if (recipe.title.toLowerCase().includes(avoidedItem)) {
      return { contains: true, matchedFood: avoidedItem };
    }
    // Check in ingredients
    for (const ingredient of recipe.ingredients) {
      if (ingredient.toLowerCase().includes(avoidedItem)) {
        return { contains: true, matchedFood: avoidedItem };
      }
    }
    // Check in description
    if (recipe.description.toLowerCase().includes(avoidedItem)) {
      return { contains: true, matchedFood: avoidedItem };
    }
  }

  return { contains: false };
}

/**
 * Tests if a recipe matches a specified dietary framework.
 */
export function recipeMatchesDietaryFramework(recipe: PlannerRecipe, framework: string): boolean {
  if (!framework || framework === 'all' || framework === 'Standard Balanced / Whole-Food') {
    return true;
  }

  const fwLower = framework.toLowerCase();

  if (fwLower.includes('vegan') || fwLower.includes('plant-based')) {
    return recipe.dietaryFrameworks.some((df) => df.toLowerCase().includes('vegan') || df.toLowerCase().includes('plant-based'));
  }

  if (fwLower.includes('vegetarian')) {
    return recipe.dietaryFrameworks.some(
      (df) => df.toLowerCase().includes('vegetarian') || df.toLowerCase().includes('vegan') || df.toLowerCase().includes('plant-based')
    );
  }

  if (fwLower.includes('pescatarian')) {
    return recipe.dietaryFrameworks.some(
      (df) => df.toLowerCase().includes('pescatarian') || df.toLowerCase().includes('vegetarian') || df.toLowerCase().includes('vegan')
    );
  }

  if (fwLower.includes('mediterranean')) {
    return recipe.dietaryFrameworks.some((df) => df.toLowerCase().includes('mediterranean'));
  }

  if (fwLower.includes('dash')) {
    return recipe.dietaryFrameworks.some((df) => df.toLowerCase().includes('dash'));
  }

  if (fwLower.includes('lower-carbohydrate') || fwLower.includes('low carb')) {
    const netCarbs = recipe.estimatedNutrients.carbs - recipe.estimatedNutrients.fiber;
    return netCarbs <= 25 || recipe.dietaryFrameworks.some((df) => df.toLowerCase().includes('lower-carbohydrate'));
  }

  // Exact or partial match
  return recipe.dietaryFrameworks.some((df) => df.toLowerCase().includes(fwLower));
}

/**
 * Parses confirmed laboratory measurements into clinical condition context
 */
function analyzeLabContext(confirmedMeasurements: ExtractedMeasurement[]): {
  hasElevatedGlucose: boolean;
  glucoseSnippet?: string;
  hasElevatedLipids: boolean;
  lipidSnippet?: string;
  hasElevatedBP: boolean;
  bpSnippet?: string;
} {
  let hasElevatedGlucose = false;
  let glucoseSnippet: string | undefined;
  let hasElevatedLipids = false;
  let lipidSnippet: string | undefined;
  let hasElevatedBP = false;
  let bpSnippet: string | undefined;

  for (const m of confirmedMeasurements) {
    const name = m.name.toLowerCase();
    const valNum = parseFloat(m.value.replace(/[^0-9.]/g, ''));

    if (name.includes('hba1c') || name.includes('a1c') || name.includes('glycated')) {
      if (!isNaN(valNum) && valNum >= 5.7) {
        hasElevatedGlucose = true;
        glucoseSnippet = `HbA1c: ${m.value}${m.unit ? ' ' + m.unit : '%'}`;
      }
    } else if (name.includes('glucose') || name.includes('fbs') || name.includes('sugar')) {
      if (!isNaN(valNum) && valNum >= 100) {
        hasElevatedGlucose = true;
        glucoseSnippet = `Fasting Glucose: ${m.value} ${m.unit || 'mg/dL'}`;
      }
    } else if (name.includes('ldl') || name.includes('total cholesterol') || name.includes('triglyceride')) {
      if (!isNaN(valNum)) {
        if ((name.includes('ldl') && valNum >= 100) || (name.includes('total') && valNum >= 200) || (name.includes('triglyceride') && valNum >= 150)) {
          hasElevatedLipids = true;
          lipidSnippet = `${m.name}: ${m.value} ${m.unit || 'mg/dL'}`;
        }
      }
    } else if (name.includes('blood pressure') || name.includes('bp') || name.includes('systolic')) {
      hasElevatedBP = true;
      bpSnippet = `${m.name}: ${m.value} ${m.unit || 'mmHg'}`;
    }
  }

  return { hasElevatedGlucose, glucoseSnippet, hasElevatedLipids, lipidSnippet, hasElevatedBP, bpSnippet };
}

/**
 * Computes recommendation score, matching reasons, trade-offs, and lab context for a recipe.
 */
export function scoreAndExplainRecipe(
  recipe: PlannerRecipe,
  profile: HealthProfile,
  confirmedMeasurements: ExtractedMeasurement[],
  activeFilterCondition?: HealthCondition | 'all'
): RecipeRecommendation {
  const nutrients = recipe.estimatedNutrients;
  const netCarbs = Math.max(0, nutrients.carbs - nutrients.fiber);

  // Determine active conditions to score against
  const profileConditions = profile.conditions || [];
  const effectiveConditions: HealthCondition[] = [];

  if (activeFilterCondition && activeFilterCondition !== 'all') {
    effectiveConditions.push(activeFilterCondition);
  } else if (profileConditions.length > 0) {
    effectiveConditions.push(...profileConditions);
  }

  const isProfilePersonalized = effectiveConditions.length > 0;
  let score = 50; // baseline neutral score
  const matchingReasons: string[] = [];
  const tradeOffs: string[] = [];
  const labAlignmentNotes: string[] = [];

  const labContext = analyzeLabContext(confirmedMeasurements);

  if (!isProfilePersonalized) {
    // General educational mode
    matchingReasons.push('General whole-food recipe with unrefined ingredients and balanced macronutrients.');
    if (nutrients.fiber >= 7) {
      matchingReasons.push(`High dietary fiber (${nutrients.fiber}g per serving) supporting satiety and digestive regularity.`);
    }
    if (nutrients.sodium <= 200) {
      matchingReasons.push(`Naturally low sodium content (${nutrients.sodium}mg per serving).`);
    }
    return {
      recipe,
      score: 50,
      matchQuality: 'neutral',
      matchingReasons,
      tradeOffs,
      labAlignmentNotes,
      isProfilePersonalized: false,
    };
  }

  // DIABETES EVALUATION
  if (effectiveConditions.includes('diabetes')) {
    const isDiabetesFocus = recipe.conditionFocus.includes('diabetes');
    if (isDiabetesFocus) score += 25;

    if (nutrients.fiber >= 8) {
      score += 25;
      matchingReasons.push(`High soluble & insoluble fiber (${nutrients.fiber}g) buffers post-meal carbohydrate absorption.`);
    } else if (nutrients.fiber >= 5) {
      score += 15;
      matchingReasons.push(`Moderate dietary fiber (${nutrients.fiber}g) helps blunt postprandial glycemic excursions.`);
    }

    if (nutrients.sugars <= 3) {
      score += 15;
      matchingReasons.push(`Very low simple sugars (${nutrients.sugars}g per serving).`);
    } else if (nutrients.sugars <= 6) {
      score += 8;
    }

    if (netCarbs <= 20) {
      score += 15;
      matchingReasons.push(`Low net carbohydrate load (${netCarbs.toFixed(1)}g net carbs) aids glycemic stability.`);
    } else if (nutrients.carbs > 40 && nutrients.fiber >= 7) {
      tradeOffs.push(
        `Total carbohydrate content is ${nutrients.carbs}g, but balanced with ${nutrients.fiber}g of complex dietary fiber which delays glucose entry into circulation.`
      );
    } else if (nutrients.carbs > 45) {
      tradeOffs.push(
        `Higher carbohydrate density (${nutrients.carbs}g). If you track strict carbohydrate counting, account for this within your mealtime insulin or carbohydrate allocation.`
      );
    }

    // Confirmed lab context for diabetes
    if (labContext.hasElevatedGlucose) {
      labAlignmentNotes.push(
        `Laboratory Context (${labContext.glucoseSnippet}): This meal provides ${nutrients.fiber}g fiber and paired protein (${nutrients.protein}g) to support glucose moderation.`
      );
    }
  }

  // CHOLESTEROL EVALUATION
  if (effectiveConditions.includes('cholesterol')) {
    const isCholesterolFocus = recipe.conditionFocus.includes('cholesterol');
    if (isCholesterolFocus) score += 25;

    if (nutrients.saturatedFat <= 1.0) {
      score += 25;
      matchingReasons.push(`Low saturated fat (${nutrients.saturatedFat}g) adheres to American Heart Association lipid reduction targets (<6% total calories).`);
    } else if (nutrients.saturatedFat <= 2.0) {
      score += 15;
      matchingReasons.push(`Controlled saturated fat (${nutrients.saturatedFat}g per serving).`);
    } else {
      tradeOffs.push(
        `Contains ${nutrients.saturatedFat}g saturated fat. While derived from whole foods, balance this against your daily saturated fat allowance.`
      );
    }

    if (nutrients.fiber >= 8) {
      score += 20;
      matchingReasons.push(`Viscous soluble fibers bind intestinal bile acids, promoting natural LDL particle clearance.`);
    }

    // Confirmed lab context for cholesterol
    if (labContext.hasElevatedLipids) {
      labAlignmentNotes.push(
        `Laboratory Context (${labContext.lipidSnippet}): Aligned with lipid goals via low saturated fat (${nutrients.saturatedFat}g) and whole-food fiber.`
      );
    }
  }

  // HYPERTENSION EVALUATION
  if (effectiveConditions.includes('hypertension')) {
    const isHypertensionFocus = recipe.conditionFocus.includes('hypertension');
    if (isHypertensionFocus) score += 25;

    if (nutrients.sodium <= 150) {
      score += 30;
      matchingReasons.push(`Very low sodium (${nutrients.sodium}mg), well below the DASH strict per-meal guideline (<200mg).`);
    } else if (nutrients.sodium <= 250) {
      score += 18;
      matchingReasons.push(`Moderate low sodium (${nutrients.sodium}mg), compatible with DASH dietary principles.`);
    } else {
      tradeOffs.push(
        `Sodium is ${nutrients.sodium}mg; fits within standard per-meal limits (<350mg), but minimize added table salt at the table.`
      );
    }

    if (nutrients.potassium && nutrients.potassium >= 500) {
      score += 20;
      matchingReasons.push(`Rich in natural dietary potassium (${nutrients.potassium}mg) and magnesium, promoting healthy vascular vasodilation.`);
    }

    // Confirmed lab context for hypertension
    if (labContext.hasElevatedBP) {
      labAlignmentNotes.push(
        `Laboratory Context (${labContext.bpSnippet}): Formulated with only ${nutrients.sodium}mg sodium and ${nutrients.potassium || 'natural'}mg potassium to support DASH electrolyte harmony.`
      );
    }
  }

  // Determine Match Quality tier
  let matchQuality: 'optimal' | 'favorable' | 'moderate' | 'neutral' = 'moderate';
  if (score >= 90) {
    matchQuality = 'optimal';
  } else if (score >= 70) {
    matchQuality = 'favorable';
  } else if (score >= 50) {
    matchQuality = 'moderate';
  }

  return {
    recipe,
    score,
    matchQuality,
    matchingReasons,
    tradeOffs,
    labAlignmentNotes,
    isProfilePersonalized: true,
  };
}

/**
 * Main recommendation pipeline:
 * 1. Hard filters out recipes containing declared allergens (ZERO TOLERANCE)
 * 2. Hard filters out recipes containing foods user wants to avoid
 * 3. Filters by dietary framework
 * 4. Filters by category
 * 5. Scores and ranks remaining recipes according to active conditions and confirmed laboratory results
 */
export function getRecommendedRecipes(
  profile: HealthProfile,
  confirmedMeasurements: ExtractedMeasurement[],
  filters: PlannerFilterCriteria = {}
): RecommendationOutput {
  const allRecipes = LOCAL_RECIPES_DATA;
  const declaredAllergies = profile.foodAllergies || [];
  const foodsToAvoid = profile.foodsToAvoid || '';
  const activeFramework = filters.dietaryFramework || profile.dietaryPreference || 'all';

  let allergenExcludedCount = 0;
  let avoidanceExcludedCount = 0;
  let frameworkExcludedCount = 0;
  let categoryExcludedCount = 0;
  let conditionExcludedCount = 0;
  const excludedRecipeTitles: string[] = [];

  const eligibleRecipes: PlannerRecipe[] = [];

  for (const recipe of allRecipes) {
    // 1. ALLERGEN FILTER (Hard Rejection)
    const allergenCheck = recipeContainsAllergen(recipe, declaredAllergies);
    if (allergenCheck.contains) {
      allergenExcludedCount++;
      excludedRecipeTitles.push(`${recipe.title} (Allergen: ${allergenCheck.matchedAllergen})`);
      continue;
    }

    // 2. FOODS TO AVOID FILTER (Hard Rejection)
    const avoidCheck = recipeContainsAvoidedFood(recipe, foodsToAvoid);
    if (avoidCheck.contains) {
      avoidanceExcludedCount++;
      excludedRecipeTitles.push(`${recipe.title} (Contains avoided food: "${avoidCheck.matchedFood}")`);
      continue;
    }

    // 3. DIETARY FRAMEWORK FILTER
    if (activeFramework && activeFramework !== 'all' && activeFramework !== 'Standard Balanced / Whole-Food') {
      if (!recipeMatchesDietaryFramework(recipe, activeFramework)) {
        frameworkExcludedCount++;
        excludedRecipeTitles.push(`${recipe.title} (Dietary Framework: not ${activeFramework})`);
        continue;
      }
    }

    // 4. CATEGORY FILTER
    if (filters.category && filters.category !== 'all') {
      if (recipe.category !== filters.category) {
        categoryExcludedCount++;
        continue;
      }
    }

    // 5. SEARCH QUERY FILTER
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inDesc = recipe.description.toLowerCase().includes(q);
      const inIngredients = recipe.ingredients.some((i) => i.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inIngredients) {
        continue;
      }
    }

    // 6. SPECIFIC CONDITION FILTER (if requested in toolbar)
    if (filters.condition && filters.condition !== 'all') {
      if (!recipe.conditionFocus.includes(filters.condition)) {
        conditionExcludedCount++;
        continue;
      }
    }

    eligibleRecipes.push(recipe);
  }

  // Score and rank eligible recipes
  const scoredRecommendations = eligibleRecipes.map((recipe) =>
    scoreAndExplainRecipe(recipe, profile, confirmedMeasurements, filters.condition)
  );

  // Deterministic sorting: highest score first, then alphabetical title
  scoredRecommendations.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.recipe.title.localeCompare(b.recipe.title);
  });

  const isProfilePersonalized =
    (profile.conditions && profile.conditions.length > 0) ||
    (filters.condition !== undefined && filters.condition !== 'all');

  const exclusionSummary: FilterExclusionSummary = {
    allergenExcludedCount,
    avoidanceExcludedCount,
    frameworkExcludedCount,
    categoryExcludedCount,
    conditionExcludedCount,
    totalExcluded: allRecipes.length - eligibleRecipes.length,
    excludedRecipeTitles,
  };

  return {
    recommendations: scoredRecommendations,
    exclusionSummary,
    totalAvailable: allRecipes.length,
    isProfilePersonalized,
    activeProfileConditions: profile.conditions || [],
    activeAllergens: declaredAllergies,
    activeAvoidances: foodsToAvoid
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    hasConfirmedLabs: confirmedMeasurements.length > 0,
  };
}
