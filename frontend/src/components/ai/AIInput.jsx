import { useEffect, useRef } from 'react';

import useSpeechRecognition from '../../hooks/useSpeechRecognition.js';
import { useToast } from '../../context/ToastContext.jsx';

const MAX_LENGTH = 1000;

function AIInput({ value, onChange, onSubmit, disabled, onBeforeListen }) {
  const textareaRef = useRef(null);
  const toast = useToast();
  const lastReportedErrorRef = useRef('');

  const {
    isSupported: micSupported,
    status: micStatus,
    errorMessage: micError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({ onTranscriptChange: onChange });

  // Surface recognition failures the same way every other transient error in
  // this app is reported - once per distinct failure, not once per render.
  useEffect(() => {
    if (micStatus === 'error' && micError && lastReportedErrorRef.current !== micError) {
      lastReportedErrorRef.current = micError;
      toast.error(micError);
    }
    if (micStatus !== 'error') {
      lastReportedErrorRef.current = '';
    }
  }, [micStatus, micError, toast]);

  function handleMicClick() {
    if (micStatus === 'listening' || micStatus === 'processing') {
      stopListening();
      return;
    }
    onBeforeListen?.(); // stop any AI speech currently playing so the mic doesn't pick it up
    onChange('');
    startListening();
  }

  function submit() {
    if (disabled || !value.trim()) return;
    // Submitting mid-dictation would otherwise leave recognition running in
    // the background and overwrite the just-cleared input on its next result.
    if (micStatus === 'listening' || micStatus === 'processing') stopListening();
    onSubmit();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const isListening = micStatus === 'listening';
  const isProcessing = micStatus === 'processing';
  const micDisabled = disabled && !isListening && !isProcessing;

  return (
    <div>
      <form
        className="dhms-ai-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {micSupported && (
          <button
            type="button"
            className={`dhms-ai-mic-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleMicClick}
            disabled={micDisabled}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <i className={`bi ${isListening ? 'bi-stop-fill' : 'bi-mic-fill'}`} />
          </button>
        )}
        <textarea
          ref={textareaRef}
          className="dhms-ai-input"
          rows={1}
          placeholder={isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Type your dental question...'}
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Type your dental question"
        />
        <button
          type="submit"
          className="btn btn-primary dhms-ai-send-btn"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          {disabled ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : <i className="bi bi-send-fill" />}
        </button>
      </form>

      {(isListening || isProcessing) && (
        <div className="dhms-ai-mic-status" aria-live="polite">
          <span className="dhms-ai-mic-dot" />
          {isListening ? 'Listening… speak now' : 'Processing…'}
        </div>
      )}

      {!micSupported && (
        <div className="dhms-ai-input-hint">Voice input isn't supported in this browser. Please type your question instead.</div>
      )}
    </div>
  );
}

export default AIInput;
