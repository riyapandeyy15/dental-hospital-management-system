import { useEffect, useRef, useState } from 'react';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import AIMessageBubble from '../../components/ai/AIMessageBubble.jsx';
import AITypingIndicator from '../../components/ai/AITypingIndicator.jsx';
import AIWelcomeState from '../../components/ai/AIWelcomeState.jsx';
import AISafetyNotice from '../../components/ai/AISafetyNotice.jsx';
import AIInput from '../../components/ai/AIInput.jsx';
import * as aiAssistantService from '../../api/aiAssistantService.js';

// Only the last few turns are kept client-side and sent as context - this is
// a session-only conversation (nothing persisted to a database for Phase 9),
// and the backend independently re-caps whatever history is sent here.
const MAX_HISTORY_TURNS = 8;

let nextId = 1;

function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = { id: nextId++, role: 'user', content: trimmed, timestamp: new Date() };
    const historyForRequest = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const reply = await aiAssistantService.sendMessage({ message: trimmed, history: historyForRequest });
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      const message = err.response?.data?.message || "Sorry, I couldn't process that request right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', content: message, retryText: trimmed }]);
    } finally {
      setIsSending(false);
    }
  }

  function retry(text) {
    setMessages((prev) => prev.filter((m) => !(m.role === 'error' && m.retryText === text)));
    send(text);
  }

  return (
    <PatientLayout title="AI Dental Assistant" subtitle="General dental guidance, explained simply.">
      <div className="dhms-ai-header dhms-stagger-in">
        <div className="dhms-ai-header-icon">
          <i className="bi bi-stars" />
        </div>
        <div>
          <h2 className="h5 fw-semibold mb-0">DentiFlow AI</h2>
          <p className="text-muted mb-0 small">Dental Assistant &middot; General dental guidance, explained simply.</p>
        </div>
      </div>

      <div className="dhms-ai-shell dhms-stagger-in">
        {messages.length > 0 && (
          <div className="dhms-ai-shell-notice">
            <AISafetyNotice />
          </div>
        )}

        <div className="dhms-ai-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <AIWelcomeState onSelectSuggestion={send} />
          ) : (
            <>
              {messages.map((m) =>
                m.role === 'error' ? (
                  <AIMessageBubble key={m.id} role="error" content={m.content} onRetry={() => retry(m.retryText)} />
                ) : (
                  <AIMessageBubble key={m.id} role={m.role} content={m.content} timestamp={m.timestamp} />
                )
              )}
              {isSending && <AITypingIndicator />}
            </>
          )}
        </div>

        <AIInput value={input} onChange={setInput} onSubmit={() => send(input)} disabled={isSending} />
      </div>
    </PatientLayout>
  );
}

export default AIAssistant;
