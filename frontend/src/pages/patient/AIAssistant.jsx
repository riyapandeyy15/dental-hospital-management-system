import { useEffect, useRef, useState } from 'react';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import AIMessageBubble from '../../components/ai/AIMessageBubble.jsx';
import AITypingIndicator from '../../components/ai/AITypingIndicator.jsx';
import AIWelcomeState from '../../components/ai/AIWelcomeState.jsx';
import AISafetyNotice from '../../components/ai/AISafetyNotice.jsx';
import AIInput from '../../components/ai/AIInput.jsx';
import * as aiAssistantService from '../../api/aiAssistantService.js';
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis.js';
import { buildHistoryForRequest, reconcileAfterRetry } from '../../utils/aiConversation.js';

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
  const { isSupported: canSpeak, speakingId, speak, stop: stopSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessageId = nextId++;
    const userMessage = { id: userMessageId, role: 'user', content: trimmed, timestamp: new Date() };
    const historyForRequest = buildHistoryForRequest(messages, MAX_HISTORY_TURNS);

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const reply = await aiAssistantService.sendMessage({ message: trimmed, history: historyForRequest });
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      const message = err.response?.data?.message || "Sorry, I couldn't process that request right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', content: message, retryText: trimmed, failedMessageId: userMessageId }]);
    } finally {
      setIsSending(false);
    }
  }

  // Removes the failed user turn and its error bubble before resending, so
  // a retry replaces that turn in place instead of duplicating it (both on
  // screen and in the history sent on the next request).
  function retry(errorMessage) {
    setMessages((prev) => reconcileAfterRetry(prev, errorMessage));
    send(errorMessage.retryText);
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
          {!canSpeak && <p className="text-muted mb-0 small">Voice output isn't supported in this browser.</p>}
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
                  <AIMessageBubble key={m.id} role="error" content={m.content} onRetry={() => retry(m)} />
                ) : (
                  <AIMessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    timestamp={m.timestamp}
                    canSpeak={m.role === 'assistant' && canSpeak}
                    isSpeaking={speakingId === m.id}
                    onSpeak={() => speak(m.id, m.content)}
                    onStopSpeak={stopSpeaking}
                  />
                )
              )}
              {isSending && <AITypingIndicator />}
            </>
          )}
        </div>

        <AIInput value={input} onChange={setInput} onSubmit={() => send(input)} disabled={isSending} onBeforeListen={stopSpeaking} />
      </div>
    </PatientLayout>
  );
}

export default AIAssistant;
