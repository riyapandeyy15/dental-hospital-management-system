// Verifies the script-detection heuristic used to pick a speech-synthesis
// voice for each AI reply. Pure function, no DOM/browser APIs involved, so
// this runs directly under plain Node - no browser, no live AI calls.
//
// Run with: npm run verify:language-detection

import { detectSpeechLang, DEFAULT_SPEECH_LANG } from '../src/utils/languageDetection.js';

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function check(name, text, expectedLang) {
  try {
    const got = detectSpeechLang(text);
    assert(got === expectedLang, `expected '${expectedLang}', got '${got}'`);
    record(name, true);
  } catch (err) {
    record(name, false, err.message);
  }
}

check('English text maps to en-IN', 'Why does my tooth hurt?', DEFAULT_SPEECH_LANG);
check('Romanized Hinglish text maps to en-IN (Roman script)', 'Mera dant kyon dukh raha hai?', DEFAULT_SPEECH_LANG);
check('Devanagari Hindi text maps to hi-IN', 'मेरे दांत में दर्द है, क्या करूं?', 'hi-IN');
check('Devanagari Marathi text also maps to hi-IN (shared script, no mr-IN browser voice)', 'माझा दात दुखत आहे', 'hi-IN');
check('Gujarati script maps to gu-IN', 'મારા દાંતમાં દુખાવો છે', 'gu-IN');
check('Bengali script maps to bn-IN', 'আমার দাঁতে ব্যথা করছে', 'bn-IN');
check('Tamil script maps to ta-IN', 'எனக்கு பல் வலிக்கிறது', 'ta-IN');
check('Telugu script maps to te-IN', 'నా పంటి నొప్పిగా ఉంది', 'te-IN');
check('Arabic/Urdu script maps to ur-PK', 'میرے دانت میں درد ہے', 'ur-PK');
check('Empty string falls back to the default', '', DEFAULT_SPEECH_LANG);
check('Mixed script follows the first non-Latin script found', 'My tooth: मेरे दांत में दर्द है', 'hi-IN');

try {
  const got = detectSpeechLang(null);
  if (got !== DEFAULT_SPEECH_LANG) throw new Error(`expected '${DEFAULT_SPEECH_LANG}', got '${got}'`);
  record('Non-string input falls back to the default without throwing', true);
} catch (err) {
  record('Non-string input falls back to the default without throwing', false, err.message);
}

console.log('');
const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.log(`${failed.length} check(s) FAILED.`);
  process.exit(1);
}
console.log(`All ${results.length} checks PASSED.`);
process.exit(0);
