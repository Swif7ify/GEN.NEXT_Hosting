import { validateDemoName } from './validation/nameValidator.js';

console.log('--- RUNNING VALIDATION UNIT TESTS ---');

const testCases = [
  // 1. Empty / Whitespace-only
  { input: '', expectedValid: false, reason: 'Empty string' },
  { input: '   ', expectedValid: false, reason: 'Whitespace only' },
  { input: '\t\n  ', expectedValid: false, reason: 'Tabs and newlines' },

  // 2. Normal valid names
  { input: 'Alice Smith', expectedValid: true, reason: 'Standard name' },
  { input: 'John Doe Jr.', expectedValid: true, reason: 'Name with period' },
  { input: 'María López', expectedValid: true, reason: 'Name with accents' },
  { input: 'DevOps Webinar Demo', expectedValid: true, reason: 'Typical demo label' },

  // 3. Length limits
  { input: 'A'.repeat(50), expectedValid: true, reason: 'Exactly 50 chars' },
  { input: 'A'.repeat(51), expectedValid: false, reason: '51 chars (exceeds max)' },

  // 4. Scunthorpe problem test cases (MUST NOT be rejected!)
  { input: 'Cassandra Adams', expectedValid: true, reason: 'Cassandra contains "ass"' },
  { input: 'Dickson Jones', expectedValid: true, reason: 'Dickson contains "dick"' },
  { input: 'Titus Pullo', expectedValid: true, reason: 'Titus contains "tit"' },
  { input: 'John Hancock', expectedValid: true, reason: 'Hancock contains "cock"' },
  { input: 'Scunthorpe Team', expectedValid: true, reason: 'Scunthorpe contains severe substring' },
  { input: 'Butter Smith', expectedValid: true, reason: 'Butter contains "butt"' },
  { input: 'Pass Leader', expectedValid: true, reason: 'Pass contains "ass"' },

  // 5. Profanity filter rejection (Plain)
  { input: 'fuck', expectedValid: false, reason: 'Direct vulgarity' },
  { input: 'shit', expectedValid: false, reason: 'Direct vulgarity' },
  { input: 'bitch', expectedValid: false, reason: 'Direct vulgarity' },
  { input: 'cunt', expectedValid: false, reason: 'Direct vulgarity' },
  { input: 'ass', expectedValid: false, reason: 'Standalone offensive token' },

  // 6. Obfuscation & bypass attempts (MUST BE CAUGHT)
  { input: 'f.u.c.k', expectedValid: false, reason: 'Dotted separators' },
  { input: 'f-u-c-k', expectedValid: false, reason: 'Hyphenated separators' },
  { input: 'f u c k', expectedValid: false, reason: 'Space separators' },
  { input: 'b!tch', expectedValid: false, reason: 'Leetspeak exclamation' },
  { input: 'b1tch', expectedValid: false, reason: 'Leetspeak numeral 1' },
  { input: 'sh1t', expectedValid: false, reason: 'Leetspeak sh1t' },
  { input: 'fuuuuuck', expectedValid: false, reason: 'Repeated characters' },
  { input: 'a$$', expectedValid: false, reason: 'Dollar sign substitution' },

  // 7. Control characters
  { input: 'Hello\u0000World', expectedValid: false, reason: 'Null byte control char' },
  { input: 'Test\u0007Bell', expectedValid: false, reason: 'ASCII bell control char' },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = validateDemoName(tc.input);
  if (result.isValid === tc.expectedValid) {
    passed++;
    console.log(`✓ PASS: "${tc.input}" (${tc.reason}) -> isValid: ${result.isValid}`);
  } else {
    failed++;
    console.error(`✗ FAIL: "${tc.input}" (${tc.reason}) -> expected ${tc.expectedValid}, got ${result.isValid}. Error: ${result.error?.message}`);
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
