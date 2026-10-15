// Pure helpers for AIAssistant.jsx's chat state - split out so the
// history-building and retry-dedup logic can be unit tested directly
// (see frontend/scripts/verifyAIConversationFlow.js) without a React
// component test harness.

// Builds the `history` array sent to the backend: only completed
// user/assistant turns (never 'error' entries - a failed turn has no
// valid assistant reply to replay back), capped to the last `maxTurns`.
export function buildHistoryForRequest(messages, maxTurns) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-maxTurns)
    .map((m) => ({ role: m.role, content: m.content }));
}

// After a failed send, the UI keeps both the original (failed) user
// bubble and an 'error' bubble with a Retry action. Retrying must remove
// both before resending - otherwise the stale failed user turn stays in
// `messages`, gets rendered a second time once the retry succeeds, and
// gets replayed a second time (alongside the resent message) in the next
// request's history.
export function reconcileAfterRetry(messages, errorMessage) {
  return messages.filter((m) => m.id !== errorMessage.id && m.id !== errorMessage.failedMessageId);
}
