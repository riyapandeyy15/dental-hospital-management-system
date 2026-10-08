import { useRef } from 'react';

const MAX_LENGTH = 1000;

function AIInput({ value, onChange, onSubmit, disabled }) {
  const textareaRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <form
      className="dhms-ai-input-bar"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        className="dhms-ai-input"
        rows={1}
        placeholder="Type your dental question..."
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
  );
}

export default AIInput;
