import {
  STANDALONE_BLOCKED_WORDS,
  SEVERE_BLOCKED_WORDS,
  LEGITIMATE_NAME_EXEMPTIONS,
} from './profanityList.js';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationErrorDetail;
  sanitizedValue?: string;
}

/**
 * Character mapping for common leetspeak substitutions.
 */
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
  '$': 's',
  '5': 's',
  '7': 't',
  '+': 't',
  'v': 'u',
  '\\/': 'v',
  'vv': 'w',
  '2': 'z',
};

/**
 * Normalizes leetspeak, collapsed separators, and repeated characters.
 */
export function normalizeTextForFilter(input: string): string {
  let normalized = input.toLowerCase();

  // Substitute common leetspeak characters
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(char);
  }

  // Collapse sequences of single characters separated by symbols or spaces
  // e.g. "f . u . c . k" or "f-u-c-k" or "f_u_c_k" -> "fuck"
  normalized = normalized.replace(/\b([a-z])[\s._\-*~#@$%^+=/]+(?=[a-z]\b)/g, '$1');

  return normalized;
}

/**
 * Collapses consecutive identical characters to single characters (e.g. "fuuuuck" -> "fuck")
 */
export function collapseRepeatedChars(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

/**
 * Check if the text contains prohibited abusive terms.
 * Accounts for leetspeak, separator bypasses, and protects against the Scunthorpe problem.
 */
export function containsProfanity(rawText: string): boolean {
  const cleanRaw = rawText.trim().toLowerCase();

  // Split into tokens (words) by whitespace and common punctuation
  const rawTokens = cleanRaw.split(/[\s,.;:!?/\\_+\-~*#|<>(){}\[\]"']+/).filter(Boolean);

  // Normalized version for detecting obfuscation
  const normalizedText = normalizeTextForFilter(rawText);
  const normalizedTokens = normalizedText.split(/[\s,.;:!?/\\_+\-~*#|<>(){}\[\]"']+/).filter(Boolean);

  // Helper to check token against dictionaries
  const testTokens = (tokens: string[]): boolean => {
    for (const token of tokens) {
      if (!token) continue;

      // 1. Check if token is explicitly whitelisted
      if (LEGITIMATE_NAME_EXEMPTIONS.includes(token)) {
        continue;
      }

      // 2. Check standalone blocked words (exact token match only to prevent Scunthorpe issues)
      if (STANDALONE_BLOCKED_WORDS.includes(token)) {
        return true;
      }

      // 3. Check severe blocked words (exact token match or compound match)
      for (const severe of SEVERE_BLOCKED_WORDS) {
        if (token === severe) {
          return true;
        }

        // For compound words (e.g. "dumbshit", "fuckface", "shithole"):
        // Only trigger substring match if the token starts/ends with or clearly embeds the severe term
        // and token is not on the exemption list.
        if (token.length > severe.length && token.includes(severe)) {
          // Additional safety check: if token is a known legitimate name substring, skip
          const isExempt = LEGITIMATE_NAME_EXEMPTIONS.some((exempt) => exempt.includes(token));
          if (!isExempt) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Test original tokens, normalized leet tokens, and repeated-char-collapsed tokens
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

  // Also check if normalized continuous string contains severe words without separators
  // e.g. "f-u-c-k" collapsed into "fuck"
  const collapsedNormalized = collapseRepeatedChars(normalizedText.replace(/[\s._\-*~#@$%^+=/]/g, ''));
  for (const severe of SEVERE_BLOCKED_WORDS) {
    if (collapsedNormalized === severe) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a demonstration name input.
 * Follows strict policies:
 * - Trims whitespace
 * - Rejects empty / whitespace-only values
 * - Enforces max length 50 characters
 * - Rejects control characters
 * - Case-insensitive profanity & obfuscation filter
 * - Does not repeat offensive input in errors
 */
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

  // Empty or whitespace-only check
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name is required and cannot be empty or whitespace only.',
      },
    };
  }

  // Length check (max 50 chars)
  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name must be 50 characters or fewer (received ' + trimmed.length + ').',
      },
    };
  }

  // Control characters check (\u0000-\u001F, \u007F-\u009F)
  // eslint-disable-next-line no-control-regex
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

  // Profanity and abusive language check
  if (containsProfanity(trimmed)) {
    // Return a respectful message WITHOUT repeating offensive input
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
