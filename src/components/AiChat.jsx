import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAccessToken, getRefreshToken } from '../lib/api';
import translations from '../translations';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LANG_MAP = { en: 'en', vn: 'vi', kr: 'ko', jp: 'ja' };
const SCROLL_KEY = 'hcm-chat-scroll';

const ChatBubbleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px', flexShrink: 0 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function AiChat({ language, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hasInitScrolled = useRef(false);

  const t = translations[language];
  const edgeLang = LANG_MAP[language] || 'en';

  useEffect(() => {
    loadHistory();
    return () => {
      if (containerRef.current) {
        sessionStorage.setItem(SCROLL_KEY, String(containerRef.current.scrollTop));
      }
    };
  }, []);

  // After history loads: restore saved scroll or go to bottom
  useEffect(() => {
    if (historyLoading || hasInitScrolled.current) return;
    hasInitScrolled.current = true;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && containerRef.current) {
      containerRef.current.scrollTop = parseInt(saved, 10);
    } else {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [historyLoading]);

  // Auto-scroll to bottom on new messages / typing indicator changes
  useEffect(() => {
    if (!hasInitScrolled.current) return;
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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true })
        .limit(30);
      if (data) {
        setMessages(data.map(m => ({ id: m.id, role: m.role, content: m.content })));
      }
    } catch {}
    finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setInput('');
    setChatError(null);
    setSending(true);

    // Optimistic render
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);

    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ question: trimmed, language: edgeLang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.reply }]);
    } catch {
      setChatError(t.chatErrorNetwork);
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

  const isEmpty = !historyLoading && messages.length === 0 && !chatError;

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
      <div className="ai-chat-messages" ref={containerRef}>
        {historyLoading && (
          <div className="ai-chat-spinner">
            <div className="loading-spinner" />
          </div>
        )}

        {isEmpty && (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-heading">{t.chatEmptyHeading}</div>
            <div className="ai-chat-suggestions">
              {[t.chatSuggestion1, t.chatSuggestion2, t.chatSuggestion3, t.chatSuggestion4].map(
                (s, i) => (
                  <button
                    key={i}
                    className="ai-chat-suggestion"
                    onClick={() => sendMessage(s)}
                    disabled={sending}
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {!historyLoading &&
          messages.map(msg => (
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
