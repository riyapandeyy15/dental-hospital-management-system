function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// role: 'user' | 'assistant' | 'error' (a failed assistant turn, rendered
// distinctly with a Retry action instead of plain text).
//
// Speak/stop controls only ever apply to 'assistant' messages - never user
// input, never error text - and only render at all when the browser
// supports speech synthesis (`canSpeak`).
function AIMessageBubble({ role, content, timestamp, onRetry, canSpeak, isSpeaking, onSpeak, onStopSpeak }) {
  if (role === 'user') {
    return (
      <div className="dhms-ai-row dhms-ai-row-user">
        <div className="dhms-ai-bubble dhms-ai-bubble-user">
          <div className="dhms-ai-bubble-text">{content}</div>
        </div>
        {timestamp && <div className="dhms-ai-timestamp text-end">{formatTime(timestamp)}</div>}
      </div>
    );
  }

  if (role === 'error') {
    return (
      <div className="dhms-ai-row dhms-ai-row-assistant">
        <div className="dhms-ai-avatar">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <div className="dhms-ai-bubble dhms-ai-bubble-error">
          <div className="dhms-ai-bubble-text">{content}</div>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={onRetry}>
              <i className="bi bi-arrow-clockwise me-1" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dhms-ai-row dhms-ai-row-assistant">
      <div className="dhms-ai-avatar">
        <i className="bi bi-stars" />
      </div>
      <div className="dhms-ai-bubble dhms-ai-bubble-assistant">
        <div className="dhms-ai-bubble-text">{content}</div>
        <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
          {timestamp ? <div className="dhms-ai-timestamp mt-0">{formatTime(timestamp)}</div> : <span />}
          {canSpeak && (
            <button
              type="button"
              className="dhms-ai-speak-btn"
              onClick={isSpeaking ? onStopSpeak : onSpeak}
              aria-pressed={isSpeaking}
              aria-label={isSpeaking ? 'Stop speaking' : 'Speak response aloud'}
              title={isSpeaking ? 'Stop speaking' : 'Speak response aloud'}
            >
              <i className={`bi ${isSpeaking ? 'bi-stop-circle-fill' : 'bi-volume-up-fill'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIMessageBubble;
