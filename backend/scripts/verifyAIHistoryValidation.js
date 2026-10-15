// Mocked verification of the "Invalid conversation history" bug fix.
//
// Root cause: validateInput() in ai.service.js applied the same
// MAX_MESSAGE_LENGTH (1000 chars, meant for user-typed input) to every
// history entry, including assistant replies. Assistant replies are
// bounded by MAX_OUTPUT_TOKENS (a token count) in aiProvider.js, not by
// character count, so a normal ~500-token reply with bullet formatting
// routinely exceeds 1000 characters - and once that reply was echoed back
// as history on the next turn, the backend rejected the whole request.
//
// This does NOT call the real Gemini API - aiProvider.generateReply is
// stubbed, so every check here is free and deterministic.
//
// Run with: npm run verify:ai-history

const aiProvider = require('../src/services/aiProvider');

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const calls = [];
aiProvider.generateReply = async ({ systemPrompt, messages }) => {
  calls.push({ systemPrompt, messages });
  return 'stubbed reply';
};

const aiService = require('../src/modules/ai/ai.service');

async function expectReject(fn, label) {
  try {
    await fn();
    record(label, false, 'expected it to throw, but it did not');
  } catch (err) {
    try {
      assert(err.status === 400, `expected status 400, got ${err.status}`);
      assert(err.message === 'Invalid conversation history.', `expected the history error message, got "${err.message}"`);
      record(label, true);
    } catch (innerErr) {
      record(label, false, innerErr.message);
    }
  }
}

async function main() {
  // 1. A long-but-realistic assistant reply (>1000 chars, well within a
  // 500-token budget) used to be rejected as history. It must now pass.
  const longAssistantReply = 'This is a general dental explanation. '.repeat(40); // ~1560 chars
  assert(longAssistantReply.length > 1000 && longAssistantReply.length < 4000, 'test fixture should sit between the old and new limits');
  try {
    await aiService.chat('Follow-up question', [
      { role: 'user', content: 'Why do my gums bleed?' },
      { role: 'assistant', content: longAssistantReply },
    ]);
    record('A realistic long assistant reply (>1000 chars) in history is accepted', true);
  } catch (err) {
    record('A realistic long assistant reply (>1000 chars) in history is accepted', false, err.message);
  }

  // 2. Multiple consecutive messages, each carrying the growing history
  // (including prior long replies), must all succeed in sequence.
  try {
    let history = [];
    for (let i = 0; i < 4; i += 1) {
      await aiService.chat(`Question number ${i}`, history);
      history = [
        ...history,
        { role: 'user', content: `Question number ${i}` },
        { role: 'assistant', content: longAssistantReply },
      ];
    }
    record('4 consecutive messages with accumulating long-reply history all succeed', true);
  } catch (err) {
    record('4 consecutive messages with accumulating long-reply history all succeed', false, err.message);
  }

  // 3. An assistant turn is still rejected once it exceeds the new,
  // larger-but-still-bounded ceiling - this isn't an unbounded allowance.
  const oversizedAssistantReply = 'x'.repeat(4001);
  await expectReject(
    () => aiService.chat('Another question', [{ role: 'assistant', content: oversizedAssistantReply }]),
    'An assistant history turn over the new 4000-char ceiling is still rejected'
  );

  // 4. A user-role history turn over the ORIGINAL 1000-char limit is still
  // rejected - the fix only widens the limit for 'assistant' turns, it
  // does not weaken validation for user-supplied content.
  const oversizedUserTurn = 'y'.repeat(1001);
  await expectReject(
    () => aiService.chat('Another question', [{ role: 'user', content: oversizedUserTurn }]),
    'A user history turn over the original 1000-char limit is still rejected'
  );

  // 5. Malformed role/shape in history is still rejected (regression).
  await expectReject(
    () => aiService.chat('Another question', [{ role: 'system', content: 'x' }]),
    'A history turn with an invalid role is still rejected'
  );
  await expectReject(
    () => aiService.chat('Another question', [{ role: 'user', content: 42 }]),
    'A history turn with non-string content is still rejected'
  );

  // 6. The live user-supplied `message` field is still capped at 1000
  // chars exactly as before - this fix only touches history validation.
  try {
    await aiService.chat('z'.repeat(1001), []);
    record('A user message over 1000 chars is still rejected', false, 'expected it to throw');
  } catch (err) {
    try {
      assert(err.status === 400, `expected status 400, got ${err.status}`);
      record('A user message over 1000 chars is still rejected', true);
    } catch (innerErr) {
      record('A user message over 1000 chars is still rejected', false, innerErr.message);
    }
  }

  record(`No live Gemini API calls were made (${calls.length} calls, all served by the local stub)`, true);

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
