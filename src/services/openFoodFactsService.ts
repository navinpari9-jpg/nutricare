import { NutritionProduct, ProductNutrientData } from '../types';

export interface BarcodeValidationResult {
  isValid: boolean;
  cleanedBarcode: string;
  errorMessage?: string;
}

export interface ProductLookupServiceResult {
  success: boolean;
  status: 'found' | 'not-found' | 'error';
  product?: NutritionProduct;
  errorMessage?: string;
}

/**
 * Validates a barcode string for GTIN/EAN/UPC standards (8 to 14 numeric digits).
 */
export function validateBarcode(rawBarcode: string): BarcodeValidationResult {
  if (!rawBarcode || typeof rawBarcode !== 'string') {
    return {
      isValid: false,
      cleanedBarcode: '',
      errorMessage: 'Barcode input cannot be empty.',
    };
  }

  // Remove spaces, hyphens, and whitespace
  const cleaned = rawBarcode.replace(/[\s-]/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      cleanedBarcode: '',
      errorMessage: 'Please enter a barcode number.',
    };
  }

  // Must be strictly digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedBarcode: cleaned,
      errorMessage: 'Barcode must contain numeric digits only (no letters or special symbols).',
    };
  }

  // Common barcode standards: EAN-8 (8), UPC-A (12), EAN-13 (13), ITF-14 (14)
  if (cleaned.length < 8 || cleaned.length > 14) {
    return {
      isValid: false,
      cleanedBarcode: cleaned,
      errorMessage: `Invalid barcode length (${cleaned.length} digits). Standard barcodes are between 8 and 14 digits.`,
    };
  }

  return {
    isValid: true,
    cleanedBarcode: cleaned,
  };
}

/**
 * Parses numeric value strictly without substituting zero for missing or null data.
 */
function parseNutrientNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') {
    return undefined;
  }
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Parses a nutrient set (either per 100g or per serving) from the raw nutriments object.
 */
function parseNutrientSet(
  nutriments: Record<string, unknown>,
  basis: '100g' | 'serving'
): ProductNutrientData {
  const suffix = `_${basis}`;

  // Energy in kcal
  const energyKcal = parseNutrientNumber(
    nutriments[`energy-kcal${suffix}`] ?? nutriments[`energy-kcal`]
  );
  const energyKj = parseNutrientNumber(
    nutriments[`energy${suffix}`]
  );

  // Macronutrients
  const carbohydrates = parseNutrientNumber(nutriments[`carbohydrates${suffix}`]);
  const sugars = parseNutrientNumber(nutriments[`sugars${suffix}`]);
  const saturatedFat = parseNutrientNumber(nutriments[`saturated-fat${suffix}`]);
  const fat = parseNutrientNumber(nutriments[`fat${suffix}`]);
  const fiber = parseNutrientNumber(nutriments[`fiber${suffix}`]);
  const protein = parseNutrientNumber(nutriments[`protein${suffix}`]);

  // Sodium and Salt
  const rawSodiumVal = parseNutrientNumber(nutriments[`sodium${suffix}`]);
  const sodiumUnit = (typeof nutriments['sodium_unit'] === 'string' && nutriments['sodium_unit']) ? nutriments['sodium_unit'] : 'g';
  const sodium = rawSodiumVal !== undefined ? { value: rawSodiumVal, unit: sodiumUnit } : undefined;

  const rawSaltVal = parseNutrientNumber(nutriments[`salt${suffix}`]);
  const saltUnit = (typeof nutriments['salt_unit'] === 'string' && nutriments['salt_unit']) ? nutriments['salt_unit'] : 'g';
  const salt = rawSaltVal !== undefined ? { value: rawSaltVal, unit: saltUnit } : undefined;

  return {
    energyKcal,
    energyKj,
    carbohydrates,
    sugars,
    saturatedFat,
    fat,
    sodium,
    salt,
    fiber,
    protein,
  };
}

/**
 * Queries the public Open Food Facts API v2 for a given barcode.
 */
export async function lookupProductByBarcode(
  rawBarcode: string,
  signal?: AbortSignal
): Promise<ProductLookupServiceResult> {
  const validation = validateBarcode(rawBarcode);
  if (!validation.isValid) {
    return {
      success: false,
      status: 'error',
      errorMessage: validation.errorMessage || 'Invalid barcode format.',
    };
  }

  const barcode = validation.cleanedBarcode;
  const endpoint = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_en,brands,image_url,image_front_url,serving_size,nutriments,ingredients_text,ingredients_text_en,completeness,nutrition_data_per`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (response.status === 404) {
      return {
        success: false,
        status: 'not-found',
        errorMessage: `No product data available for this barcode (${barcode}).`,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        status: 'error',
        errorMessage: 'Open Food Facts service rate limit reached. Please wait a moment before trying again.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: 'error',
        errorMessage: `Open Food Facts server returned error status ${response.status}. Please try again later.`,
      };
    }

    const data = await response.json();

    // Open Food Facts v2 returns status: 1 when product is found, and status: 0 when not found
    if (data.status !== 1 || !data.product) {
      return {
        success: false,
        status: 'not-found',
        errorMessage: `No product data available for barcode: ${barcode}`,
      };
    }

    const prod = data.product;
    const nutriments = (prod.nutriments && typeof prod.nutriments === 'object') ? prod.nutriments : {};

    // Extract per-100g and per-serving sets
    const per100g = parseNutrientSet(nutriments, '100g');
    const perServing = parseNutrientSet(nutriments, 'serving');

    // Default active basis: prefer 'serving' if servingSize and serving data exist, otherwise '100g'
    const hasServingData = perServing.carbohydrates !== undefined || perServing.sodium !== undefined || perServing.saturatedFat !== undefined;
    const nutritionBasis: '100g' | 'serving' = hasServingData ? 'serving' : '100g';

    // Check which essential nutrients are missing in both sets
    const activeData = nutritionBasis === 'serving' ? perServing : per100g;
    const missingNutrients: string[] = [];

    if (activeData.carbohydrates === undefined && per100g.carbohydrates === undefined) {
      missingNutrients.push('Total Carbohydrates');
    }
    if (activeData.sugars === undefined && per100g.sugars === undefined) {
      missingNutrients.push('Total Sugars');
    }
    if (activeData.saturatedFat === undefined && per100g.saturatedFat === undefined) {
      missingNutrients.push('Saturated Fat');
    }
    if (activeData.sodium === undefined && activeData.salt === undefined && per100g.sodium === undefined && per100g.salt === undefined) {
      missingNutrients.push('Sodium / Salt');
    }

    const isCompleteNutrition = missingNutrients.length === 0;

    const productName = prod.product_name || prod.product_name_en || 'Unnamed Product Record';
    const brand = prod.brands || undefined;
    const imageUrl = prod.image_url || prod.image_front_url || undefined;
    const servingSize = prod.serving_size || undefined;
    const ingredients = prod.ingredients_text || prod.ingredients_text_en || undefined;

    const parsedProduct: NutritionProduct = {
      barcode,
      name: productName,
      brand,
      imageUrl,
      servingSize,
      nutritionBasis,
      per100g,
      perServing,
      ingredients,
      completeness: typeof prod.completeness === 'number' ? prod.completeness : undefined,
      isCompleteNutrition,
      missingNutrients,
      dataSource: 'Open Food Facts',
      lookupTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isManual: false,
    };

    return {
      success: true,
      status: 'found',
      product: parsedProduct,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        status: 'error',
        errorMessage: 'Lookup request was cancelled.',
      };
    }

    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return {
      success: false,
      status: 'error',
      errorMessage: `Could not connect to Open Food Facts API (${message}). Check your internet connection and try again.`,
    };
  }
}
