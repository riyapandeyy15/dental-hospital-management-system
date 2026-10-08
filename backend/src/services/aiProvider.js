// The ONLY file in this codebase that talks to the AI provider's SDK and
// knows its request/response shape. Everything else (ai.service.js, and
// anything built on top of it later) calls `generateReply` and never sees
// provider-specific types, so swapping providers later means changing only
// this file.
//
// The API key lives in AI_API_KEY (backend/.env, gitignored) and is never
// read by or shipped to the frontend.

const Anthropic = require('@anthropic-ai/sdk');
const env = require('../config/env');

let client = null;
function getClient() {
  if (!env.AI_API_KEY) {
    throw new Error('AI assistant is not configured on the server.');
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.AI_API_KEY });
  }
  return client;
}

// messages: [{ role: 'user' | 'assistant', content: string }], already
// validated and trimmed by the caller. Returns the plain text reply.
async function generateReply({ systemPrompt, messages }) {
  try {
    const response = await getClient().messages.create({
      model: env.AI_MODEL,
      max_tokens: env.AI_MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || !textBlock.text) {
      throw new Error('Empty response from AI provider.');
    }
    return textBlock.text;
  } catch (err) {
    // Never leak provider error details (status codes, request ids, raw
    // messages that could hint at the key or internal config) to the client.
    console.error('AI provider request failed:', err.message);
    throw new Error('The AI assistant is temporarily unavailable. Please try again in a moment.');
  }
}

module.exports = { generateReply };
