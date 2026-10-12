import {
  STANDALONE_BLOCKED_WORDS,
  SEVERE_BLOCKED_WORDS,
  LEGITIMATE_NAME_EXEMPTIONS,
} from './profanityList';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationErrorDetail;
  sanitizedValue?: string;
}

const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '(': 'c',
  '<': 'c',
  '3': 'e',
  '€': 'e',
  '6': 'g',
  '9': 'g',
  '!': 'i',
  '1': 'i',
  '|': 'i',
  '0': 'o',
  $: 's',
  '5': 's',
  '7': 't',
  '+': 't',
  v: 'u',
  '\\/': 'v',
  vv: 'w',
  '2': 'z',
};

export function normalizeTextForFilter(input: string): string {
  let normalized = input.toLowerCase();

  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(char);
  }

  normalized = normalized.replace(
    /\b([a-z])[\s._\-*~#@$%^+=/]+(?=[a-z]\b)/g,
    '$1'
  );

  return normalized;
}

export function collapseRepeatedChars(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

export function containsProfanity(rawText: string): boolean {
  const cleanRaw = rawText.trim().toLowerCase();

  const rawTokens = cleanRaw
    .split(/[\s,.;:!?/\\_+\-~*#|<>(){}\[\]"']+/)
    .filter(Boolean);
  const normalizedText = normalizeTextForFilter(rawText);
  const normalizedTokens = normalizedText
    .split(/[\s,.;:!?/\\_+\-~*#|<>(){}\[\]"']+/)
    .filter(Boolean);

  const testTokens = (tokens: string[]): boolean => {
    for (const token of tokens) {
      if (!token) continue;

      if (LEGITIMATE_NAME_EXEMPTIONS.includes(token)) {
        continue;
      }

      if (STANDALONE_BLOCKED_WORDS.includes(token)) {
        return true;
      }

      for (const severe of SEVERE_BLOCKED_WORDS) {
        if (token === severe) {
          return true;
        }

        if (token.length > severe.length && token.includes(severe)) {
          const isExempt = LEGITIMATE_NAME_EXEMPTIONS.some((exempt) =>
            exempt.includes(token)
          );
          if (!isExempt) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (testTokens(rawTokens)) {
    return true;
  }
  if (testTokens(normalizedTokens)) {
    return true;
  }
  const collapsedTokens = normalizedTokens.map(collapseRepeatedChars);
  if (testTokens(collapsedTokens)) {
    return true;
  }

  const collapsedNormalized = collapseRepeatedChars(
    normalizedText.replace(/[\s._\-*~#@$%^+=/]/g, '')
  );
  for (const severe of SEVERE_BLOCKED_WORDS) {
    if (collapsedNormalized === severe) {
      return true;
    }
  }

  return false;
}

export function validateDemoName(input: unknown): ValidationResult {
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name must be a valid text string.',
      },
    };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name is required and cannot be empty or whitespace only.',
      },
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: `Name must be 50 characters or fewer (currently ${trimmed.length}).`,
      },
    };
  }

  const controlCharRegex = /[\u0000-\u001F\u007F-\u009F]/;
  if (controlCharRegex.test(trimmed)) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name contains invalid control characters.',
      },
    };
  }

  if (containsProfanity(trimmed)) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name contains prohibited or inappropriate language.',
      },
    };
  }

  return {
    isValid: true,
    sanitizedValue: trimmed,
  };
}

/**
 * Mobile-specific name formatter.
 * Concatenates " (Mobile)" to the input name (e.g. "Ada Lovelace" -> "Ada Lovelace (Mobile)").
 * Avoids duplicate suffix if already present.
 */
export function formatMobileName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('(Mobile)')) return trimmed;
  return `${trimmed} (Mobile)`;
}

/**
 * Validates the raw input taking the "(Mobile)" suffix into account.
 */
export function validateMobileInput(rawInput: string): ValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name is required and cannot be empty.',
      },
    };
  }

  const formatted = formatMobileName(rawInput);
  return validateDemoName(formatted);
}
