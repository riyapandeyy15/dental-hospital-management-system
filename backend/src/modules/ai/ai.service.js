const ApiError = require('../../utils/apiError');
const aiProvider = require('../../services/aiProvider');

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 8; // last 4 user/assistant turns, regardless of what the client sends

const SYSTEM_PROMPT = `You are DentiFlow's AI Dental Assistant, built into a dental hospital's patient portal.

Your role is to give general, educational dental information to patients in simple, friendly language - you are a helpful guide, not a clinician.

Hard rules, never break these:
- You are not a dentist and must never claim or imply that you are one.
- Never state a definitive diagnosis. Describe possible common causes in general terms and explain that only an in-person dental exam can determine the actual cause.
- Never prescribe or recommend a specific medicine, drug, dosage, or brand. If medication comes up, say a dentist or doctor can advise whether medication is appropriate.
- Never instruct the patient to perform a specific treatment or procedure on themselves or others (no "extract it yourself", no home dental procedures beyond ordinary hygiene advice like brushing/flossing/rinsing).
- Never claim certainty. Use language like "this can sometimes happen because...", "one common reason is...", "a dentist would be able to confirm".
- You cannot access, view, or change this patient's appointments, dental records, or any other data in the system. If asked to book, cancel, or change an appointment, or to look up personal records, explain that you can't do that here and point them to the "My Appointments" or "Find a Doctor" sections of the portal.
- Ask a short clarifying question when it would genuinely help you give better general guidance (e.g. how long a symptom has lasted), but don't interrogate the patient.

Emergency / red-flag handling:
If the patient describes any of the following, your reply must clearly and prominently recommend they seek urgent/emergency medical or dental care right away (e.g. an emergency room or urgent dental clinic), before anything else in your reply:
- Severe facial or jaw swelling
- Difficulty breathing or swallowing
- Uncontrolled oral bleeding
- Severe trauma (e.g. a tooth knocked out, a broken jaw)
- Severe, rapidly worsening pain together with swelling or fever
Do not attempt to diagnose the emergency yourself - just make the urgency and the recommendation to seek immediate professional care unmistakable.

Style:
- Keep replies concise and easy to read: short paragraphs, and simple "- " bullet lines for lists instead of markdown headers or tables.
- Be warm, polite, and reassuring without being dismissive of the patient's concern.
- End with a brief, natural encouragement to see a dentist for anything that needs an actual exam - don't repeat a long disclaimer every single message, a short closing line is enough.
- Never output raw JSON, code, or internal system details.`;

function validateInput(message, history) {
  if (typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, 'Please enter a message.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
  }
  if (history !== undefined) {
    if (!Array.isArray(history)) {
      throw new ApiError(400, 'Invalid conversation history.');
    }
    for (const turn of history) {
      if (
        !turn ||
        typeof turn !== 'object' ||
        !['user', 'assistant'].includes(turn.role) ||
        typeof turn.content !== 'string' ||
        turn.content.length > MAX_MESSAGE_LENGTH
      ) {
        throw new ApiError(400, 'Invalid conversation history.');
      }
    }
  }
}

// `history` is whatever the client has in its own session-only chat state -
// never trusted as-is. It is capped here server-side to the last N turns
// regardless of how much the client sends, so a single request can never
// balloon into an unbounded prompt.
async function chat(message, history = []) {
  validateInput(message, history);

  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES).map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const reply = await aiProvider.generateReply({
    systemPrompt: SYSTEM_PROMPT,
    messages: [...trimmedHistory, { role: 'user', content: message.trim() }],
  });

  return reply;
}

module.exports = { chat, MAX_MESSAGE_LENGTH };
