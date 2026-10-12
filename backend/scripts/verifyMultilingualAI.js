// Mocked verification of the multilingual AI Dental Assistant upgrade.
//
// This does NOT call the real Gemini API - it monkey-patches
// aiProvider.generateReply with a stub before requiring ai.service.js, so
// every check here is free, deterministic, and safe to run as often as
// needed without touching Gemini's quota. It checks the WIRING (the right
// language instructions reach the provider, history/validation still work
// correctly for non-Latin and mixed-script input) rather than asking a
// live model to prove it replies correctly - that part is Gemini's own
// behavior, governed by the system prompt this script inspects.
//
// Run with: npm run verify:multilingual-ai

const aiProvider = require('../src/services/aiProvider');

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Replace the provider call with a stub that just records what it was
// asked to do and returns a canned reply - no network, no API key needed.
const calls = [];
aiProvider.generateReply = async ({ systemPrompt, messages }) => {
  calls.push({ systemPrompt, messages });
  return 'stubbed reply';
};

// ai.service.js reads `aiProvider.generateReply` as a property at call
// time (not destructured at require time), so patching the export above
// before requiring it here is enough to take effect.
const aiService = require('../src/modules/ai/ai.service');

async function main() {
  // 1. The system prompt sent to the provider explicitly instructs
  // language/script mirroring - this is the core multilingual fix.
  await aiService.chat('मेरे दांत में दर्द है, क्या करूं?');
  try {
    const { systemPrompt } = calls[calls.length - 1];
    assert(/same language/i.test(systemPrompt), 'expected a same-language instruction in the system prompt');
    assert(/Devanagari/i.test(systemPrompt), 'expected the system prompt to mention Devanagari script');
    assert(/Hinglish/i.test(systemPrompt), 'expected the system prompt to mention Hinglish');
    assert(/Marathi/i.test(systemPrompt) && /Gujarati/i.test(systemPrompt), 'expected other supported languages to be named');
    record('System prompt instructs the model to mirror the patient\'s language and script', true);
  } catch (err) {
    record('System prompt instructs the model to mirror the patient\'s language and script', false, err.message);
  }

  // 2. Devanagari Hindi message passes through to the provider unchanged
  // (no local translation/mutation - language handling is Gemini's job).
  try {
    const hindiMsg = 'मेरे दांत में दर्द है, क्या करूं?';
    await aiService.chat(hindiMsg);
    const lastUserTurn = calls[calls.length - 1].messages.slice(-1)[0];
    assert(lastUserTurn.role === 'user' && lastUserTurn.content === hindiMsg, 'expected the Devanagari message to reach the provider unchanged');
    record('Devanagari Hindi message passes through to the provider unchanged', true);
  } catch (err) {
    record('Devanagari Hindi message passes through to the provider unchanged', false, err.message);
  }

  // 3. Romanized Hinglish message passes through unchanged too.
  try {
    const hinglishMsg = 'Mera dant kyon dukh raha hai?';
    await aiService.chat(hinglishMsg);
    const lastUserTurn = calls[calls.length - 1].messages.slice(-1)[0];
    assert(lastUserTurn.role === 'user' && lastUserTurn.content === hinglishMsg, 'expected the Hinglish message to reach the provider unchanged');
    record('Romanized Hinglish message passes through to the provider unchanged', true);
  } catch (err) {
    record('Romanized Hinglish message passes through to the provider unchanged', false, err.message);
  }

  // 4. A language switch mid-conversation (English history, then a
  // Marathi follow-up) still sends the full history plus the new message
  // as-is - the model decides the reply language from this, not our code.
  try {
    const history = [
      { role: 'user', content: 'Why do my gums bleed?' },
      { role: 'assistant', content: 'stubbed reply' },
    ];
    await aiService.chat('दात दुखत आहे, मराठीत सांगा', history);
    const sentMessages = calls[calls.length - 1].messages;
    assert(sentMessages.length === 3, `expected 3 messages (2 history + 1 new), got ${sentMessages.length}`);
    assert(sentMessages[2].content.includes('मराठी'), 'expected the Marathi follow-up to be the final message sent');
    record('Language switch mid-conversation sends full history plus the new-language message', true);
  } catch (err) {
    record('Language switch mid-conversation sends full history plus the new-language message', false, err.message);
  }

  // 5. History is still capped server-side regardless of language mix.
  try {
    const longHistory = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: i % 4 === 0 ? `सवाल ${i}` : `question ${i}`,
    }));
    await aiService.chat('English follow-up', longHistory);
    const sentMessages = calls[calls.length - 1].messages;
    assert(sentMessages.length === 9, `expected history capped to 8 + 1 new message (9), got ${sentMessages.length}`);
    record('Mixed-language history is still capped to the last N turns', true);
  } catch (err) {
    record('Mixed-language history is still capped to the last N turns', false, err.message);
  }

  // 6. Existing validation still rejects bad input - unaffected by the
  // multilingual change, since it only touches the system prompt text.
  try {
    let rejected = false;
    try {
      await aiService.chat('   ');
    } catch {
      rejected = true;
    }
    assert(rejected, 'expected an empty message to still be rejected');
    record('Existing input validation (empty message) still rejects correctly', true);
  } catch (err) {
    record('Existing input validation (empty message) still rejects correctly', false, err.message);
  }

  try {
    let rejected = false;
    try {
      await aiService.chat('नमस्ते', [{ role: 'system', content: 'x' }]);
    } catch {
      rejected = true;
    }
    assert(rejected, 'expected malformed history to still be rejected even with non-Latin message text');
    record('Existing input validation (malformed history) still rejects correctly', true);
  } catch (err) {
    record('Existing input validation (malformed history) still rejects correctly', false, err.message);
  }

  // 7. Confirm no real network/provider call was ever made - every call()
  // above only ever hit the local stub.
  try {
    assert(calls.length > 0, 'expected the stub to have been called');
    record(`No live Gemini API calls were made (${calls.length} calls, all served by the local stub)`, true);
  } catch (err) {
    record('No live Gemini API calls were made', false, err.message);
  }

  console.log('');
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log(`${failed.length} check(s) FAILED.`);
    process.exit(1);
  }
  console.log(`All ${results.length} checks PASSED.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification script crashed:', err.message);
  process.exit(1);
});
