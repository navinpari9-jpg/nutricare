import { NutritionProduct, HealthCondition, ProductNutrientData } from '../types';

export interface ConditionExplanation {
  condition: HealthCondition | 'general';
  title: string;
  hasRelevantData: boolean;
  missingFields: string[];
  explanation: string;
  guidelineContext: string;
}

/**
 * Formats a nutrient value or returns a descriptive placeholder.
 */
function formatVal(val: number | undefined, unit: string = 'g'): string {
  if (val === undefined || val === null) return 'Not reported';
  return `${val.toLocaleString()} ${unit}`;
}

/**
 * Analyzes product nutrition data relative to user conditions under educational guidelines.
 * Strict rules:
 * - Never declares product "safe" or "unsafe".
 * - Explains only actual reported values.
 * - Explains missing fields when data is incomplete.
 */
export function generateNutritionExplanations(
  product: NutritionProduct,
  userConditions: HealthCondition[],
  activeBasis: '100g' | 'serving'
): ConditionExplanation[] {
  const nutrientData: ProductNutrientData =
    (activeBasis === 'serving' && product.perServing ? product.perServing : product.per100g) || {};

  const basisLabel = activeBasis === 'serving'
    ? (product.servingSize ? `per serving (${product.servingSize})` : 'per serving')
    : 'per 100g';

  const explanations: ConditionExplanation[] = [];

  // If no conditions selected in profile, return General Balanced Nutrition guidance
  if (!userConditions || userConditions.length === 0) {
    const hasCarbs = nutrientData.carbohydrates !== undefined;
    const hasSatFat = nutrientData.saturatedFat !== undefined;
    const hasSodium = nutrientData.sodium !== undefined || nutrientData.salt !== undefined;

    const missingGeneral: string[] = [];
    if (!hasCarbs) missingGeneral.push('Carbohydrates');
    if (!hasSatFat) missingGeneral.push('Saturated Fat');
    if (!hasSodium) missingGeneral.push('Sodium/Salt');

    const generalExplanation =
      `This product displays nutrition facts ${basisLabel}: ` +
      `Carbohydrates: ${formatVal(nutrientData.carbohydrates)}, ` +
      `Sugars: ${formatVal(nutrientData.sugars)}, ` +
      `Saturated Fat: ${formatVal(nutrientData.saturatedFat)}, ` +
      `Sodium: ${nutrientData.sodium ? `${nutrientData.sodium.value} ${nutrientData.sodium.unit}` : (nutrientData.salt ? `Salt: ${nutrientData.salt.value} ${nutrientData.salt.unit}` : 'Not reported')}` +
      (nutrientData.fiber !== undefined ? `, Fiber: ${nutrientData.fiber} g.` : '.') +
      ` General dietary guidance encourages balanced meals rich in whole nutrients, moderate in sodium, and mindful of saturated fats and added sugars.`;

    explanations.push({
      condition: 'general',
      title: 'General Nutrition Overview (No Profile Conditions Active)',
      hasRelevantData: hasCarbs || hasSatFat || hasSodium,
      missingFields: missingGeneral,
      explanation: generalExplanation,
      guidelineContext: 'Educational baseline. Configure conditions in your Health Profile to see condition-tailored considerations.',
    });

    return explanations;
  }

  // 1. Diabetes Explanation
  if (userConditions.includes('diabetes')) {
    const hasCarbs = nutrientData.carbohydrates !== undefined;
    const hasSugars = nutrientData.sugars !== undefined;
    const hasFiber = nutrientData.fiber !== undefined;

    const missing: string[] = [];
    if (!hasCarbs) missing.push('Total Carbohydrates');
    if (!hasSugars) missing.push('Total Sugars');

    if (!hasCarbs && !hasSugars) {
      explanations.push({
        condition: 'diabetes',
        title: 'Type 2 Diabetes & Glycemic Awareness',
        hasRelevantData: false,
        missingFields: missing,
        explanation: `Carbohydrate and sugar metrics are not reported on this product label ${basisLabel}. Because carbohydrate counting is central to glycemic management, impact on blood sugar cannot be estimated.`,
        guidelineContext: 'Carbohydrate tracking helps manage post-meal blood glucose.',
      });
    } else {
      let text = `Reported ${basisLabel}: Total Carbohydrates = ${formatVal(nutrientData.carbohydrates)}`;
      if (hasSugars) {
        text += `, including ${nutrientData.sugars} g total sugars`;
      }
      if (hasFiber) {
        text += `, with ${nutrientData.fiber} g dietary fiber`;
      }
      text += '.';

      text += ` For glycemic balance, tracking total carbohydrate grams relative to portion size helps manage post-meal glucose response. Dietary fiber can help slow carbohydrate absorption.`;

      explanations.push({
        condition: 'diabetes',
        title: 'Type 2 Diabetes & Glycemic Awareness',
        hasRelevantData: true,
        missingFields: missing,
        explanation: text,
        guidelineContext: 'Educational information only. Consult your care provider for personalized carbohydrate targets.',
      });
    }
  }

  // 2. High Cholesterol Explanation
  if (userConditions.includes('cholesterol')) {
    const hasSatFat = nutrientData.saturatedFat !== undefined;
    const hasFiber = nutrientData.fiber !== undefined;
    const missing: string[] = [];
    if (!hasSatFat) missing.push('Saturated Fat');

    if (!hasSatFat) {
      explanations.push({
        condition: 'cholesterol',
        title: 'Lipid & Cardiovascular Support',
        hasRelevantData: false,
        missingFields: missing,
        explanation: `Saturated fat content is not reported on this product record ${basisLabel}. Because saturated fat intake directly influences LDL cholesterol synthesis, lipid alignment cannot be evaluated.`,
        guidelineContext: 'Saturated fat moderation supports healthy LDL cholesterol levels.',
      });
    } else {
      let text = `Reported ${basisLabel}: Saturated Fat = ${nutrientData.saturatedFat} g`;
      if (hasFiber) {
        text += ` and Dietary Fiber = ${nutrientData.fiber} g`;
      }
      text += '.';

      text += ` General cardiovascular dietary guidelines recommend limiting saturated fat to under 5%–6% of total daily energy (approx. 11–13 g on a 2,000 kcal diet). Soluble fiber supports bile clearance and healthy cholesterol management.`;

      explanations.push({
        condition: 'cholesterol',
        title: 'Lipid & Cardiovascular Support',
        hasRelevantData: true,
        missingFields: missing,
        explanation: text,
        guidelineContext: 'Educational information only. Dietary response varies between individuals.',
      });
    }
  }

  // 3. Hypertension Explanation
  if (userConditions.includes('hypertension')) {
    const hasSodium = nutrientData.sodium !== undefined;
    const hasSalt = nutrientData.salt !== undefined;
    const missing: string[] = [];
    if (!hasSodium && !hasSalt) missing.push('Sodium / Salt');

    if (!hasSodium && !hasSalt) {
      explanations.push({
        condition: 'hypertension',
        title: 'Blood Pressure & Sodium Moderation',
        hasRelevantData: false,
        missingFields: missing,
        explanation: `Sodium and salt metrics are unavailable for this product record ${basisLabel}. Under DASH guidelines, tracking sodium is key for blood pressure moderation, so alignment cannot be assessed.`,
        guidelineContext: 'DASH guidelines emphasize sodium reduction for vascular health.',
      });
    } else {
      let text = `Reported ${basisLabel}: `;
      if (hasSodium && nutrientData.sodium) {
        const val = nutrientData.sodium.value;
        const unit = nutrientData.sodium.unit;
        // If in grams, provide documented mg equivalent
        if (unit.toLowerCase() === 'g') {
          const mgEq = Math.round(val * 1000);
          text += `Sodium = ${val} g (${mgEq.toLocaleString()} mg)`;
        } else {
          text += `Sodium = ${val} ${unit}`;
        }
      } else if (hasSalt && nutrientData.salt) {
        const saltVal = nutrientData.salt.value;
        const saltUnit = nutrientData.salt.unit;
        // Standard documented salt to sodium conversion: Sodium (g) = Salt (g) / 2.5
        const estSodiumMg = Math.round((saltVal / 2.5) * 1000);
        text += `Salt = ${saltVal} ${saltUnit} (equivalent to approx. ${estSodiumMg.toLocaleString()} mg sodium; calculated as Salt ÷ 2.5)`;
      }

      text += `. Standard DASH dietary frameworks recommend limiting daily sodium to 1,500–2,300 mg. Foods containing ≤ 140 mg sodium per serving are typically classified as low-sodium options.`;

      explanations.push({
        condition: 'hypertension',
        title: 'Blood Pressure & Sodium Moderation',
        hasRelevantData: true,
        missingFields: missing,
        explanation: text,
        guidelineContext: 'Educational information only. Always check full meal context and consult your doctor.',
      });
    }
  }

  return explanations;
}
