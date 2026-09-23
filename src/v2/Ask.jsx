import { useEffect, useMemo, useRef, useState } from 'react';
import { callAiChat } from '../components/AiChat';
import { useV, fmt } from './i18n';
import { openStatus, formatClose } from './util';

const LANG_MAP = { en: 'en', vn: 'vi', kr: 'ko', jp: 'ja' };

// The edge function answers one question at a time, so recent turns are
// folded into the question to keep follow-ups ("and after that?") in context.
function withContext(question, msgs) {
  const turns = msgs.filter((m) => m.role !== 'error').slice(-4);
  if (!turns.length) return question;
  const lines = turns.map((m) => `${m.role === 'user' ? 'Me' : 'You'}: ${m.content}`).join('\n');
  return `Our conversation so far:\n${lines}\n\nMy new question: ${question}`;
}

export default function Ask({ user, name, breweries, stamps, hatClaimed, language, onSignIn, onOpenBrewery }) {
  const v = useV(language);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const greeting = useMemo(() => {
    const count = stamps.length;
    const total = breweries.length || 8;
    const parts = [fmt(v.greetHi, { name: name ? ` ${name}` : '' })];
    if (count === 0) parts.push(v.greetStart);
    else if (count >= total) { parts.push(v.greetDone); return { text: parts.join(' '), brewery: null }; }
    else parts.push(fmt(v.greetProgress, { n: count }));
    const todo = breweries.filter((b) => !stamps.includes(b.id)).sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
    const openOne = todo.find((b) => openStatus(b).open);
    if (openOne) {
      parts.push(fmt(v.greetOpen, { place: openOne.name, t: formatClose(openStatus(openOne).closesAt, v) }));
      return { text: parts.join(' '), brewery: openOne };
    }
    const next = todo.map((b) => ({ b, st: openStatus(b) })).find((x) => x.st.opensAt);
    if (next) parts.push(fmt(v.greetNoneOpen, { place: next.b.name, t: next.st.opensAt }));
    return { text: parts.join(' '), brewery: next?.b || null };
  }, [breweries, stamps, name, v]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    const history = msgs;
    setMsgs((m) => [...m, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const data = await callAiChat({ question: withContext(q, history), language: LANG_MAP[language] || 'en', history: history.slice(-6) });
      setMsgs((m) => [...m, { role: 'assistant', content: data?.reply || v.askError }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'error', content: v.askError }]);
    } finally {
      setBusy(false);
    }
  };

  const sugs = [v.sug1, v.sug2, v.sug3, hatClaimed ? null : v.sug4].filter(Boolean);

  return (
    <div className="v2-ask">
      <div className="head">
        <div className="inner">
          <h1 className="display" style={{ fontSize: '1.9rem' }}>{v.askTitle}</h1>
          <div style={{ fontSize: '.8rem' }}>{v.askSub}</div>
        </div>
      </div>
      {!user ? (
        <div className="msgs">
          <div className="bubble bot">{v.signInForAsk}</div>
          <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={onSignIn}>{v.signIn}</button>
        </div>
      ) : (
        <>
          <div className="msgs" aria-live="polite">
            <div className="bubble bot">{greeting.text}</div>
            {greeting.brewery && (
              <button type="button" className="bubble bot" style={{ padding: 0, overflow: 'hidden', textAlign: 'left' }} onClick={() => onOpenBrewery(greeting.brewery)}>
                <span style={{ display: 'block', padding: '10px 12px' }}>
                  <b style={{ display: 'block' }}>{greeting.brewery.name}</b>
                  <span style={{ fontSize: '.85rem' }}>{greeting.brewery.district} · {v.view} ›</span>
                </span>
              </button>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role === 'user' ? 'me' : m.role === 'error' ? 'bot err' : 'bot'}`}>{m.content}</div>
            ))}
            {busy && <div className="bubble bot typing" aria-label={v.loading}><span /><span /><span /></div>}
            {!busy && (
              <div className="sugs">
                {sugs.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="bar">
            <form className="inner" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <textarea rows={1} value={input} placeholder={v.askPlaceholder} aria-label={v.askPlaceholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <button type="submit" disabled={!input.trim() || busy} aria-label="Send">↑</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
