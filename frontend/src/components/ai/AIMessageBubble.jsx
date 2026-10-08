function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// role: 'user' | 'assistant' | 'error' (a failed assistant turn, rendered
// distinctly with a Retry action instead of plain text).
function AIMessageBubble({ role, content, timestamp, onRetry }) {
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
        {timestamp && <div className="dhms-ai-timestamp">{formatTime(timestamp)}</div>}
      </div>
    </div>
  );
}

export default AIMessageBubble;
