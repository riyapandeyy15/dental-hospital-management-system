function AITypingIndicator() {
  return (
    <div className="dhms-ai-row dhms-ai-row-assistant">
      <div className="dhms-ai-avatar">
        <i className="bi bi-stars" />
      </div>
      <div className="dhms-ai-bubble dhms-ai-bubble-assistant dhms-ai-typing" aria-live="polite" aria-label="DentiFlow AI is typing">
        <span className="dhms-ai-typing-dot" />
        <span className="dhms-ai-typing-dot" />
        <span className="dhms-ai-typing-dot" />
      </div>
    </div>
  );
}

export default AITypingIndicator;
