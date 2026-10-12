import { formatMobileName, validateMobileInput } from './src/nameValidator';

console.log('--- RUNNING MOBILE VALIDATION TESTS ---');

// 1. Basic concatenation test
const name1 = 'Ada Lovelace';
const formatted1 = formatMobileName(name1);
console.log(`1. formatMobileName("${name1}") => "${formatted1}"`);
if (formatted1 !== 'Ada Lovelace (Mobile)') {
  throw new Error(`Expected "Ada Lovelace (Mobile)", got "${formatted1}"`);
}

// 2. Prevent duplicate suffix
const name2 = 'Ada Lovelace (Mobile)';
const formatted2 = formatMobileName(name2);
console.log(`2. formatMobileName("${name2}") => "${formatted2}"`);
if (formatted2 !== 'Ada Lovelace (Mobile)') {
  throw new Error(`Expected "Ada Lovelace (Mobile)", got "${formatted2}"`);
}

// 3. Valid input
const res1 = validateMobileInput('Ada Lovelace');
console.log(`3. validateMobileInput("Ada Lovelace"): isValid = ${res1.isValid}`);
if (!res1.isValid) {
  throw new Error('Ada Lovelace should be valid');
}

// 4. Empty input
const res2 = validateMobileInput('   ');
console.log(`4. validateMobileInput("   "): isValid = ${res2.isValid}, error = "${res2.error?.message}"`);
if (res2.isValid) {
  throw new Error('Whitespace input should be invalid');
}

// 5. Profanity input
const res3 = validateMobileInput('fuck');
console.log(`5. validateMobileInput("fuck"): isValid = ${res3.isValid}, error = "${res3.error?.message}"`);
if (res3.isValid) {
  throw new Error('Profanity should be invalid');
}

// 6. Max length limit: 41 + 9 = 50 chars (valid)
const res4 = validateMobileInput('A'.repeat(41));
console.log(`6. validateMobileInput(41 chars): isValid = ${res4.isValid}`);
if (!res4.isValid) {
  throw new Error('41 chars should be valid (50 total with suffix)');
}

// 7. Exceeds max length limit: 42 + 9 = 51 chars (invalid)
const res5 = validateMobileInput('A'.repeat(42));
console.log(`7. validateMobileInput(42 chars): isValid = ${res5.isValid}, error = "${res5.error?.message}"`);
if (res5.isValid) {
  throw new Error('42 chars should be invalid (51 total with suffix)');
}

console.log('✅ ALL MOBILE VALIDATION TESTS PASSED!');
