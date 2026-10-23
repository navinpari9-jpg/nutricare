import { ExtractedMeasurement, ExtractionConfidence } from '../types';

interface AnalyteDefinition {
  canonicalName: string;
  aliases: RegExp[];
  unitPatterns: RegExp[];
  valuePattern: RegExp;
  typicalMin?: number;
  typicalMax?: number;
}

const ANALYTES: AnalyteDefinition[] = [
  {
    canonicalName: 'Hemoglobin A1c (HbA1c)',
    aliases: [
      /\b(?:HbA1c|Hb\s*A1c|Hgb\s*A1c|Hemoglobin\s*A1c|Glycated\s*Hemoglobin|Glycohemoglobin|A1C)\b/i,
    ],
    unitPatterns: [/%/, /\bmmol\/mol\b/i],
    valuePattern: /\b([3-9]\.[0-9]|[1-2][0-9]\.[0-9]|[4-9]|[1-2][0-9])\b/,
    typicalMin: 3.5,
    typicalMax: 20,
  },
  {
    canonicalName: 'Fasting Blood Glucose',
    aliases: [
      /\b(?:Fasting\s*Blood\s*Glucose|Fasting\s*Glucose|Fasting\s*Blood\s*Sugar|FBS|Glucose,\s*Fasting|Fasting\s*Plasma\s*Glucose|Plasma\s*Glucose|Blood\s*Glucose)\b/i,
      /\bGlucose\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\bmmol\/L\b/i],
    valuePattern: /\b([4-9][0-9]|[1-4][0-9]{2}|[2-9]\.[0-9]|1[0-9]\.[0-9])\b/,
  },
  {
    canonicalName: 'Total Cholesterol',
    aliases: [
      /\b(?:Total\s*Cholesterol|Cholesterol,\s*Total|Cholesterol\s*Total|Cholesterol)\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\bmmol\/L\b/i],
    valuePattern: /\b([1-4][0-9]{2}|[2-9]\.[0-9]|1[0-5]\.[0-9])\b/,
  },
  {
    canonicalName: 'LDL Cholesterol',
    aliases: [
      /\b(?:LDL\s*Cholesterol|LDL-C|LDL\s*Calculated|LDL\s*Direct|LDL\s*Chol|Low\s*Density\s*Lipoprotein)\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\bmmol\/L\b/i],
    valuePattern: /\b([3-9][0-9]|[1-3][0-9]{2}|[0-9]\.[0-9]|1[0-2]\.[0-9])\b/,
  },
  {
    canonicalName: 'HDL Cholesterol',
    aliases: [
      /\b(?:HDL\s*Cholesterol|HDL-C|HDL\s*Direct|HDL\s*Chol|High\s*Density\s*Lipoprotein)\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\bmmol\/L\b/i],
    valuePattern: /\b([2-9][0-9]|1[0-5][0-9]|[0-9]\.[0-9])\b/,
  },
  {
    canonicalName: 'Triglycerides',
    aliases: [
      /\b(?:Triglycerides|Triglyceride|TRIG|Serum\s*Triglycerides)\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\bmmol\/L\b/i],
    valuePattern: /\b([3-9][0-9]|[1-9][0-9]{2}|[0-9]\.[0-9]|1[0-5]\.[0-9])\b/,
  },
  {
    canonicalName: 'Serum Creatinine',
    aliases: [
      /\b(?:Serum\s*Creatinine|Creatinine,\s*Serum|Creatinine|CREAT)\b/i,
    ],
    unitPatterns: [/\bmg\/dL\b/i, /\b[uµ]mol\/L\b/i],
    valuePattern: /\b([0-9]\.[0-9]{1,2}|[1-9]\.[0-9]{1,2}|[4-9][0-9]|[1-9][0-9]{2})\b/,
  },
  {
    canonicalName: 'eGFR (Glomerular Filtration Rate)',
    aliases: [
      /\b(?:eGFR|Estimated\s*GFR|GFR\s*Calculated|GFR)\b/i,
    ],
    unitPatterns: [/\bmL\/min(?:\/1\.73m2)?\b/i],
    valuePattern: /(?:[><]\s*)?([1-9][0-9]{1,2}|[0-9])\b/,
  },
  {
    canonicalName: 'Potassium',
    aliases: [
      /\b(?:Potassium|Serum\s*Potassium|K\+)\b/i,
    ],
    unitPatterns: [/\bmmol\/L\b/i, /\bmEq\/L\b/i],
    valuePattern: /\b([2-6]\.[0-9]{1,2})\b/,
  },
];

/**
 * Searches for reference range patterns such as:
 * "< 200", "> 40", "70 - 99", "70-99 mg/dL", "0.6 - 1.2", "4.0 - 5.6 %"
 */
function extractReferenceRange(line: string): { range: string; cleanedLine: string } {
  // Common reference range patterns in medical reports with strict boundary
  const rangePatterns = [
    // Parenthesized range e.g. (70 - 99) or (< 200) or (< 120/80)
    /\(([<>]?\s*\d+(?:\.\d+)?(?:\s*(?:-|–|to|\/)\s*[<>]?\s*\d+(?:\.\d+)?)?(?:\s*[%a-zA-Z/]+)?)\)/,
    // Explicit label e.g., Ref: 70 - 99 or Reference Range: < 200
    /(?:(?:Ref(?:\.|erence)?\s*(?:Range|Interval)?[:\s]+)|(?:Normal[:\s]+))([<>]?\s*\d+(?:\.\d+)?(?:\s*(?:-|–|to|\/)\s*[<>]?\s*\d+(?:\.\d+)?)?(?:\s*[%a-zA-Z/]+)?)/i,
    // Range with dash/to: 70 - 99 or 0.60 - 1.20
    /\b(\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?(?:\s*[%a-zA-Z/]+)?)\b/i,
    // Comparison: < 200, <= 100, > 40, >= 60
    /([<>=]{1,2}\s*\d+(?:\.\d+)?(?:\s*[%a-zA-Z/]+)?)\b/i,
  ];

  for (const regex of rangePatterns) {
    const match = line.match(regex);
    if (match && match[1]) {
      const range = match[1].trim();
      // Remove the range from line to avoid detecting it as the test value
      const cleanedLine = line.replace(match[0], ' ');
      return { range, cleanedLine };
    }
  }

  return { range: '', cleanedLine: line };
}

/**
 * Searches for Blood Pressure patterns such as:
 * "Blood Pressure: 124/82 mmHg" or "BP 130 / 85"
 */
function extractBloodPressure(text: string): ExtractedMeasurement[] {
  const results: ExtractedMeasurement[] = [];
  const lines = text.split('\n');

  const bpRegex = /(?:\b(?:Blood\s*Pressure|Resting\s*BP|BP)\b[:\s]*|\bBP\b[:\s]*)?([1-2][0-9]{2}\s*\/\s*[4-9][0-9]|[1-2][0-9]{2}\s*\/\s*1[0-2][0-9])\s*(?:mmHg)?/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line mentions blood pressure or has a clear BP value with mmHg
    const hasBpKeyword = /\b(?:Blood\s*Pressure|Resting\s*BP|BP)\b/i.test(line);
    const hasMmHg = /\bmmHg\b/i.test(line);

    if (hasBpKeyword || hasMmHg) {
      const match = line.match(bpRegex);
      if (match && match[1]) {
        const bpValue = match[1].replace(/\s+/g, '');
        const { range } = extractReferenceRange(line);

        results.push({
          id: 'bp-' + Math.random().toString(36).substring(2, 8),
          name: 'Blood Pressure (Systolic / Diastolic)',
          value: bpValue,
          unit: 'mmHg',
          referenceRange: range || '< 120/80 mmHg',
          rawSnippet: line.length > 90 ? line.substring(0, 90) + '...' : line,
          confidence: hasBpKeyword ? 'high' : 'medium',
        });
        break; // Only capture one BP per document to avoid redundant fragments
      }
    }
  }

  return results;
}

/**
 * Main parser: analyzes raw text extracted from PDF or OCR and identifies laboratory results
 */
export function extractLaboratoryMeasurements(rawText: string): ExtractedMeasurement[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const measurements: ExtractedMeasurement[] = [];
  const identifiedAnalytes = new Set<string>();

  // 1. Check for Blood Pressure first
  const bpResults = extractBloodPressure(rawText);
  for (const bp of bpResults) {
    measurements.push(bp);
    identifiedAnalytes.add(bp.name);
  }

  // 2. Split text into lines for analyte matching
  const lines = rawText.split('\n');

  for (const analyte of ANALYTES) {
    if (identifiedAnalytes.has(analyte.canonicalName)) {
      continue;
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine || rawLine.length < 3) continue;

      // Check if this line matches any alias of the analyte
      let aliasMatched = false;
      let matchedAliasIndex = -1;

      for (const aliasRegex of analyte.aliases) {
        const match = rawLine.match(aliasRegex);
        if (match) {
          aliasMatched = true;
          matchedAliasIndex = match.index || 0;
          break;
        }
      }

      if (!aliasMatched) continue;

      // Only check next line if current line has NO digits at all after test name
      const hasDigitsInCurrent = /\d/.test(rawLine.slice(matchedAliasIndex));
      const contextLine = (!hasDigitsInCurrent && i < lines.length - 1 && lines[i + 1].trim().length > 0 && !lines[i + 1].includes(':'))
        ? `${rawLine} ${lines[i + 1].trim()}`
        : rawLine;

      // Extract reference range first to prevent mistaking reference range numbers for the patient value
      const { range, cleanedLine } = extractReferenceRange(contextLine);

      // Detect unit if explicitly present
      let detectedUnit = '';
      for (const uRegex of analyte.unitPatterns) {
        const uMatch = contextLine.match(uRegex);
        if (uMatch) {
          detectedUnit = uMatch[0];
          break;
        }
      }

      // Cut out the test name part from the cleaned line so we look at the value portion
      const textAfterName = cleanedLine.slice(matchedAliasIndex);

      // Find possible numeric values
      // We look for isolated numbers: integer or decimal
      const numberMatches = Array.from(textAfterName.matchAll(/\b(\d+(?:\.\d+)?)\b/g));

      if (numberMatches.length > 0) {
        // Find the most plausible value token
        let candidateValue = '';
        let confidence: ExtractionConfidence = 'high';

        // Check each number match
        for (const nm of numberMatches) {
          const numStr = nm[1];
          const numVal = parseFloat(numStr);

          // Discard numbers that are identical to year e.g. 2024, 2025, 2026
          if (numVal >= 2000 && numVal <= 2030) continue;

          // Discard single digits if analyte is cholesterol or glucose
          if (
            (analyte.canonicalName.includes('Cholesterol') || analyte.canonicalName.includes('Glucose')) &&
            !numStr.includes('.') &&
            numVal < 30 &&
            detectedUnit.toLowerCase() !== 'mmol/l'
          ) {
            continue;
          }

          candidateValue = numStr;
          break;
        }

        if (candidateValue) {
          // If no unit detected or ambiguous layout, mark confidence as needs-review
          if (!detectedUnit) {
            confidence = 'needs-review';
          } else if (range && !range.includes('-') && !range.includes('<') && !range.includes('>')) {
            confidence = 'medium';
          }

          measurements.push({
            id: 'meas-' + Math.random().toString(36).substring(2, 9),
            name: analyte.canonicalName,
            value: candidateValue,
            unit: detectedUnit,
            referenceRange: range,
            rawSnippet: rawLine.length > 95 ? rawLine.substring(0, 95) + '...' : rawLine,
            confidence,
          });

          identifiedAnalytes.add(analyte.canonicalName);
          break; // Move to next analyte
        }
      }
    }
  }

  return measurements;
}
