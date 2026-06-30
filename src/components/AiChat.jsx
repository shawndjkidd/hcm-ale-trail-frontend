import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import translations from '../translations';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LANG_MAP = { en: 'en', vn: 'vi', kr: 'ko', jp: 'ja' };

// Calls the ai-chat Edge Function with a guaranteed-fresh access token.
// Auto-retries once on 401 by forcing a session refresh, in case the token
// expired between getSession() and the fetch landing.
async function callAiChat({ question, language }) {
  const getFreshToken = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      throw new Error('Not signed in. Please sign in again.');
    }
    return session.access_token;
  };

  const doFetch = async (token) =>
    fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ question, language }),
    });

  let token = await getFreshToken();
  let response = await doFetch(token);

  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session?.access_token) {
      throw new Error('Session expired. Please sign in again.');
    }
    token = data.session.access_token;
    response = await doFetch(token);
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Chat failed (${response.status}): ${errBody.slice(0, 200)}`);
  }

  return response.json();
}

export default function AiChat({ language, onBack, stamps = [], hatClaimed = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const t = translations[language];
  const edgeLang = LANG_MAP[language] || 'en';

  // Auto-scroll to bottom on new messages / typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  // Auto-grow textarea (1–4 lines)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lh = parseInt(getComputedStyle(ta).lineHeight) || 22;
    ta.style.height = Math.min(ta.scrollHeight, lh * 4) + 'px';
  }, [input]);

  const stampCount = stamps.length;
  let contextualChip;
  if (stampCount === 0) {
    contextualChip = t.chatSuggestionNew;
  } else if (stampCount >= 8 && hatClaimed) {
    contextualChip = t.chatSuggestionStartOver;
  } else if (stampCount >= 7) {
    contextualChip = t.chatSuggestionClaimHat;
  } else {
    contextualChip = t.chatSuggestionPickBeer;
  }

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setInput('');
    setChatError(null);
    setSending(true);

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);

    try {
      const data = await callAiChat({ question: trimmed, language: edgeLang });
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.reply }]);
    } catch (err) {
      const isAuthError =
        err.message.startsWith('Session expired') ||
        err.message.startsWith('Not signed in');
      setChatError(isAuthError ? err.message : t.chatErrorNetwork);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0 && !chatError;

  return (
    <div className="ai-chat">
      {/* ── Header ── */}
      <div className="ai-chat-header">
        <button className="ai-chat-back-btn" onClick={onBack}>
          ← {t.back}
        </button>
        <div className="ai-chat-header-center">
          <div className="ai-chat-header-title">{t.chatTitle}</div>
          <div className="ai-chat-header-sub">{t.chatSubtitle}</div>
        </div>
      </div>

      {/* ── Message list ── */}
      <div className="ai-chat-messages">
        {isEmpty && (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-heading">{t.chatEmptyHeading}</div>
            <div className="ai-chat-suggestions">
              {[t.chatSuggestionTonight, contextualChip].map((s, i) => (
                <button
                  key={i}
                  className="ai-chat-suggestion"
                  onClick={() => sendMessage(s)}
                  disabled={sending}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`ai-chat-row ai-chat-row--${msg.role}`}>
            <div className={`ai-chat-bubble ai-chat-bubble--${msg.role}`}>{msg.content}</div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="ai-chat-row ai-chat-row--assistant">
            <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--typing">
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
            </div>
          </div>
        )}

        {/* Error bubble */}
        {chatError && (
          <div className="ai-chat-row ai-chat-row--error">
            <div className="ai-chat-bubble ai-chat-bubble--error">{chatError}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Footer ── */}
      <div className="ai-chat-footer">
        <div className="ai-chat-input-row">
          <textarea
            ref={textareaRef}
            className="ai-chat-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chatPlaceholder}
            rows={1}
            disabled={sending}
          />
          <button
            className="ai-chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
          >
            {t.chatSend}
          </button>
        </div>
      </div>
    </div>
  );
}
