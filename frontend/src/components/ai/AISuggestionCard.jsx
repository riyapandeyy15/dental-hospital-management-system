function AISuggestionCard({ question, onClick }) {
  return (
    <button type="button" className="dhms-ai-suggestion" onClick={() => onClick(question)}>
      <i className="bi bi-chat-dots" />
      <span>{question}</span>
    </button>
  );
}

export default AISuggestionCard;
