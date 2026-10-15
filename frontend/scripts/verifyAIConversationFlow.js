// Verifies the pure chat-state helpers behind AIAssistant.jsx's history
// building and retry logic. Pure functions, no DOM/React involved, so
// this runs directly under plain Node - no browser, no live AI calls.
//
// Run with: npm run verify:ai-conversation-flow

import { buildHistoryForRequest, reconcileAfterRetry } from '../src/utils/aiConversation.js';

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------- buildHistoryForRequest ----------

try {
  const messages = [
    { id: 1, role: 'user', content: 'Q1', timestamp: new Date() },
    { id: 2, role: 'assistant', content: 'A1', timestamp: new Date() },
    { id: 3, role: 'user', content: 'Q2', timestamp: new Date() },
    { id: 4, role: 'assistant', content: 'A2', timestamp: new Date() },
  ];
  const history = buildHistoryForRequest(messages, 8);
  assert(history.length === 4, `expected 4 history entries, got ${history.length}`);
  assert(history.every((h) => Object.keys(h).length === 2 && 'role' in h && 'content' in h), 'expected only {role, content} on each entry');
  assert(history[0].role === 'user' && history[0].content === 'Q1', 'expected the first entry to be the first user turn');
  record('Multiple consecutive completed turns are all included, stripped to {role, content}', true);
} catch (err) {
  record('Multiple consecutive completed turns are all included, stripped to {role, content}', false, err.message);
}

try {
  const messages = [
    { id: 1, role: 'user', content: 'Q1', timestamp: new Date() },
    { id: 2, role: 'error', content: 'Something went wrong', retryText: 'Q1', failedMessageId: 1 },
  ];
  const history = buildHistoryForRequest(messages, 8);
  assert(history.length === 1, `expected the error entry to be excluded, got ${history.length} entries`);
  record('Error-role entries are excluded from the request history', true);
} catch (err) {
  record('Error-role entries are excluded from the request history', false, err.message);
}

try {
  const messages = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `turn ${i}`,
    timestamp: new Date(),
  }));
  const history = buildHistoryForRequest(messages, 8);
  assert(history.length === 8, `expected history capped to 8, got ${history.length}`);
  assert(history[0].content === 'turn 12', `expected the oldest kept turn to be "turn 12", got "${history[0].content}"`);
  record('History is capped to the last maxTurns entries', true);
} catch (err) {
  record('History is capped to the last maxTurns entries', false, err.message);
}

// ---------- reconcileAfterRetry ----------

try {
  const messages = [
    { id: 1, role: 'user', content: 'Earlier question', timestamp: new Date() },
    { id: 2, role: 'assistant', content: 'Earlier reply', timestamp: new Date() },
    { id: 3, role: 'user', content: 'Failed question', timestamp: new Date() },
    { id: 4, role: 'error', content: 'Network error', retryText: 'Failed question', failedMessageId: 3 },
  ];
  const errorMessage = messages[3];
  const reconciled = reconcileAfterRetry(messages, errorMessage);
  assert(reconciled.length === 2, `expected 2 remaining messages, got ${reconciled.length}`);
  assert(reconciled.every((m) => m.id !== 3 && m.id !== 4), 'expected both the failed user turn and the error turn to be removed');
  assert(reconciled[0].id === 1 && reconciled[1].id === 2, 'expected earlier unrelated turns to be preserved in order');
  record('Retry removes both the failed user turn and its error bubble, nothing else', true);
} catch (err) {
  record('Retry removes both the failed user turn and its error bubble, nothing else', false, err.message);
}

try {
  // Simulates retrying, failing again, then retrying a second time -
  // no duplicate failed turns should accumulate across repeated retries.
  let messages = [{ id: 1, role: 'user', content: 'Q', timestamp: new Date() }];
  let errorMessage = { id: 2, role: 'error', content: 'err', retryText: 'Q', failedMessageId: 1 };
  messages = [...messages, errorMessage];
  messages = reconcileAfterRetry(messages, errorMessage);
  // "resend" after reconciling, as send() would do
  messages = [...messages, { id: 3, role: 'user', content: 'Q', timestamp: new Date() }];
  errorMessage = { id: 4, role: 'error', content: 'err again', retryText: 'Q', failedMessageId: 3 };
  messages = [...messages, errorMessage];
  messages = reconcileAfterRetry(messages, errorMessage);
  assert(messages.length === 0, `expected no leftover messages after two clean retries, got ${messages.length}`);
  record('Repeated retries never leave duplicate failed turns behind', true);
} catch (err) {
  record('Repeated retries never leave duplicate failed turns behind', false, err.message);
}

console.log('');
const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.log(`${failed.length} check(s) FAILED.`);
  process.exit(1);
}
console.log(`All ${results.length} checks PASSED.`);
process.exit(0);
