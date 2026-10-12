// Pure, dependency-free script detection used to pick a speech-synthesis
// voice that matches the AI's reply, and to label the recognition-language
// picker in AIInput.jsx. This is Unicode-script detection, not real
// language identification - it can't tell Hindi apart from Marathi when
// both are written in Devanagari, so Devanagari text maps to the more
// broadly available 'hi-IN' voice as the best practical fallback. Latin
// script (English and Romanized Hindi/Hinglish) both map to 'en-IN' since
// no browser ships a distinct Hinglish voice.
export const DEFAULT_SPEECH_LANG = 'en-IN';

const SCRIPT_RANGES = [
  { lang: 'hi-IN', pattern: /[ऀ-ॿ]/ }, // Devanagari: Hindi, Marathi
  { lang: 'bn-IN', pattern: /[ঀ-৿]/ }, // Bengali
  { lang: 'gu-IN', pattern: /[઀-૿]/ }, // Gujarati
  { lang: 'ta-IN', pattern: /[஀-௿]/ }, // Tamil
  { lang: 'te-IN', pattern: /[ఀ-౿]/ }, // Telugu
  { lang: 'ur-PK', pattern: /[؀-ۿ]/ }, // Arabic script: Urdu
];

// Returns a BCP-47 locale best suited to speak `text` aloud.
export function detectSpeechLang(text) {
  if (typeof text !== 'string' || !text) return DEFAULT_SPEECH_LANG;
  for (const { lang, pattern } of SCRIPT_RANGES) {
    if (pattern.test(text)) return lang;
  }
  return DEFAULT_SPEECH_LANG;
}

// Options for the voice-input language picker in AIInput.jsx. The Web
// Speech API needs an explicit recognition locale - it cannot auto-detect
// which language is being spoken - so the patient picks the one that
// matches how they plan to speak. "English / Hinglish" stays on an
// English-leaning locale on purpose: that's what produces Roman-script
// Hinglish transcripts when the patient speaks Hindi words in that mode.
export const RECOGNITION_LANG_OPTIONS = [
  { value: 'en-IN', label: 'English / Hinglish (Roman)' },
  { value: 'hi-IN', label: 'हिन्दी (Devanagari)' },
  { value: 'mr-IN', label: 'मराठी Marathi (Devanagari)' },
  { value: 'gu-IN', label: 'ગુજરાતી Gujarati' },
  { value: 'bn-IN', label: 'বাংলা Bengali' },
  { value: 'ta-IN', label: 'தமிழ் Tamil' },
  { value: 'te-IN', label: 'తెలుగు Telugu' },
  { value: 'ur-IN', label: 'اردو Urdu' },
];
