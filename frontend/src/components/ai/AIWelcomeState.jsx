import AISuggestionCard from './AISuggestionCard.jsx';
import AISafetyNotice from './AISafetyNotice.jsx';

const SUGGESTIONS = [
  'What should I do for tooth sensitivity?',
  'How can I maintain healthy gums?',
  'Why do gums bleed while brushing?',
  'What should I expect during a dental checkup?',
  'How often should I visit a dentist?',
];

function AIWelcomeState({ onSelectSuggestion }) {
  return (
    <div className="dhms-ai-welcome dhms-stagger-in">
      <div className="dhms-ai-welcome-icon">
        <i className="bi bi-stars" />
      </div>
      <h3 className="h5 fw-semibold mb-2">Hi, I'm DentiFlow's AI Dental Assistant</h3>
      <p className="text-muted mb-3" style={{ maxWidth: 440 }}>
        Ask me about common dental concerns, oral hygiene, what to expect at an appointment, or general care tips. I can't
        access your records or book appointments for you.
      </p>
      <div className="mb-4">
        <AISafetyNotice />
      </div>
      <div className="dhms-ai-suggestions">
        {SUGGESTIONS.map((question) => (
          <AISuggestionCard key={question} question={question} onClick={onSelectSuggestion} />
        ))}
      </div>
    </div>
  );
}

export default AIWelcomeState;
