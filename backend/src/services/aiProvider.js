// The ONLY file in this codebase that talks to the AI provider's SDK and
// knows its request/response shape. Everything else (ai.service.js, and
// anything built on top of it) calls `generateReply` with a plain
// { role: 'user' | 'assistant', content }[] array and gets back a plain
// text string - never a provider-specific type - so swapping providers
// (as happened here, Anthropic -> Google Gemini) only ever touches this
// one file.
//
// The API key lives in GEMINI_API_KEY (backend/.env, gitignored) and is
// never read by or shipped to the frontend.

const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');

const MAX_OUTPUT_TOKENS = 500;

// Gemini's hosted "flash" models occasionally return a transient 503 under
// load ("This model is currently experiencing high demand...") - observed
// in practice to succeed on a quick retry. A couple of short, bounded
// retries here meaningfully improves real-world reliability without
// touching the caller's contract or retrying anything that isn't this one
// specific, known-transient condition.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

function isTransientUnavailable(err) {
  return err?.status === 503 || /UNAVAILABLE|high demand/i.test(err?.message || '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let client = null;
function getClient() {
  if (!env.GEMINI_API_KEY) {
    throw new Error('AI assistant is not configured on the server.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

// Gemini uses 'model' where the rest of this app says 'assistant', and
// expects each turn as { role, parts: [{ text }] } rather than
// { role, content }. This mapping is the only Gemini-shaped code in the
// whole codebase.
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// messages: [{ role: 'user' | 'assistant', content: string }], already
// validated and trimmed by the caller. Returns the plain text reply.
async function generateReply({ systemPrompt, messages }) {
  const contents = toGeminiContents(messages);
  let lastErr;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await getClient().models.generateContent({
        model: env.GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from AI provider.');
      }
      return text;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS && isTransientUnavailable(err)) {
        console.error(`AI provider transiently unavailable (attempt ${attempt}/${MAX_ATTEMPTS}), retrying:`, err.message);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      break;
    }
  }

  // Never leak provider error details (status codes, request ids, raw
  // messages that could hint at the key or internal config) to the client.
  console.error('AI provider request failed:', lastErr.message);
  throw new Error('The AI assistant is temporarily unavailable. Please try again in a moment.');
}

module.exports = { generateReply };
