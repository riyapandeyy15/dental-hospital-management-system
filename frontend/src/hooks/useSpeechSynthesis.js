import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_LANG = 'en-IN';

// Single shared speech-output controller for a page - lifted to one hook
// instance at the page level (not one per message bubble) because
// window.speechSynthesis is a single global queue; only one message can
// ever really be "speaking" at a time, and starting a new one must cancel
// whatever was playing before.
//
// speakingId tracks WHICH message is currently being read, so a bubble can
// render itself as speaking/not-speaking via `speakingId === thisMessage.id`.
function useSpeechSynthesis({ lang = DEFAULT_LANG } = {}) {
  const [speakingId, setSpeakingId] = useState(null);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingId(null);
  }, [isSupported]);

  // speak() only ever reads the plain, already-rendered assistant reply text
  // passed in by the caller - never error messages, never anything from the
  // system prompt, never request/response metadata.
  const speak = useCallback(
    (id, text) => {
      if (!isSupported || !text) return;

      window.speechSynthesis.cancel(); // only one utterance plays at a time

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith('en'));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onend = () => {
        utteranceRef.current = null;
        setSpeakingId((current) => (current === id ? null : current));
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        setSpeakingId((current) => (current === id ? null : current));
      };

      utteranceRef.current = utterance;
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang]
  );

  // Never let speech continue after the page that started it goes away
  // (navigation, logout, unmount).
  useEffect(() => stop, [stop]);

  return { isSupported, speakingId, speak, stop };
}

export default useSpeechSynthesis;
