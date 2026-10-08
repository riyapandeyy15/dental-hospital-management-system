// Small, permanent disclaimer - part of the product chrome, not a dismissible
// warning banner. Shown once above the chat, never repeated per-message.
function AISafetyNotice() {
  return (
    <div className="dhms-ai-notice">
      <i className="bi bi-shield-check" />
      <span>AI-generated information is for general education only and does not replace advice from a qualified dental professional.</span>
    </div>
  );
}

export default AISafetyNotice;
