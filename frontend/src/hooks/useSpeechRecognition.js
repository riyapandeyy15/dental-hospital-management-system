import { useCallback, useEffect, useRef, useState } from 'react';

// Default locale for Phase 10 - a full language picker is Phase 11's job.
// Falls back silently to the browser's own default if 'en-IN' voices/
// recognition aren't available for the user's engine.
const DEFAULT_LANG = 'en-IN';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const FRIENDLY_ERRORS = {
  'not-allowed': 'Microphone permission was denied. Please allow microphone access or type your question.',
  'permission-denied': 'Microphone permission was denied. Please allow microphone access or type your question.',
  'audio-capture': "No microphone was found. Please check your device or type your question.",
  network: 'A network error interrupted voice recognition. Please try again or type your question.',
  'service-not-allowed': 'Voice input is not allowed in this context. Please type your question instead.',
};

// Thin wrapper around the browser's native SpeechRecognition API - never
// sends audio anywhere, never records; the browser does STT locally/via its
// own engine and only the resulting text ever leaves this hook.
//
// status: 'idle' | 'listening' | 'processing' | 'error'
// onTranscriptChange(text) fires on every interim AND final chunk, so the
// caller can mirror it straight into a controlled input value.
function useSpeechRecognition({ onTranscriptChange, lang = DEFAULT_LANG } = {}) {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  onTranscriptChangeRef.current = onTranscriptChange;

  const isSupported = Boolean(getRecognitionCtor());

  const stop = useCallback(() => {
    // .abort() rather than .stop() - we don't need the final result if the
    // user explicitly cancels, and abort is safe to call even if recognition
    // already ended.
    recognitionRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return; // already listening - ignore duplicate taps

    const Ctor = getRecognitionCtor();
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setErrorMessage('');
      setStatus('listening');
    };
    recognition.onspeechend = () => {
      // The browser is still finalizing the transcript - audio capture has
      // stopped but we don't have the result yet.
      setStatus('processing');
    };
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      onTranscriptChangeRef.current?.(text);
    };
    recognition.onerror = (event) => {
      // 'aborted' / 'no-speech' aren't real failures worth surfacing - the
      // former is us (or the user) cancelling, the latter just means silence.
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        setStatus('idle');
        return;
      }
      setErrorMessage(FRIENDLY_ERRORS[event.error] || 'Voice input ran into a problem. Please try again or type your question.');
      setStatus('error');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((prev) => (prev === 'error' ? prev : 'idle'));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Thrown synchronously if a recognizer is already active in this tab -
      // treat it the same as "ignore the duplicate request".
      recognitionRef.current = null;
    }
  }, [isSupported, lang]);

  // Never leave a live recognizer/microphone listener running past this
  // component's lifetime.
  useEffect(() => stop, [stop]);

  return { isSupported, status, errorMessage, start, stop };
}

export default useSpeechRecognition;
