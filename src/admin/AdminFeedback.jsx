// AdminFeedback.jsx
// Lightweight in-app replacements for `alert()` and `confirm()`:
//   - useToast()   → { success, error, info } for transient messages
//   - useConfirm() → async function that resolves true/false
//
// Wrap the admin tree in <AdminFeedbackProvider> once; both hooks work
// inside any descendant. No external deps. Styled in admin.css under
// `.admin-toast-*` and `.admin-confirm-*`.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ─── Context ────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);

// Safe fallback when a hook is called outside the provider: don't crash,
// just fall back to the native primitives so code still works.
const FALLBACK_TOAST = {
  success: (m) => console.info('[toast:success]', m),
  error: (m) => console.warn('[toast:error]', m),
  info: (m) => console.info('[toast:info]', m),
};
const FALLBACK_CONFIRM = async ({ message = 'Are you sure?' } = {}) =>
  typeof window !== 'undefined' ? window.confirm(message) : true;

export function useToast() {
  return useContext(ToastCtx) || FALLBACK_TOAST;
}

export function useConfirm() {
  return useContext(ConfirmCtx) || FALLBACK_CONFIRM;
}

// ─── Toast internals ────────────────────────────────────────────────────
const DEFAULT_TOAST_MS = 4000;
const ERROR_TOAST_MS = 6000; // errors stick around a bit longer

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="admin-toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`admin-toast admin-toast-${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="admin-toast-icon" aria-hidden="true">
            {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}
          </span>
          <span className="admin-toast-message">{t.message}</span>
          <button
            type="button"
            className="admin-toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm internals ──────────────────────────────────────────────────
function ConfirmDialog({ state, onAnswer }) {
  const confirmBtnRef = useRef(null);

  // Autofocus the confirm button, trap Escape/Enter.
  useEffect(() => {
    if (!state) return undefined;
    confirmBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onAnswer(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onAnswer(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onAnswer]);

  if (!state) return null;

  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = state;

  return (
    <div
      className="admin-confirm-backdrop"
      onClick={() => onAnswer(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'admin-confirm-title' : undefined}
    >
      <div
        className="admin-confirm"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 id="admin-confirm-title" className="admin-confirm-title">
            {title}
          </h3>
        )}
        {message && <p className="admin-confirm-message">{message}</p>}
        <div className="admin-confirm-actions">
          <button
            type="button"
            className="admin-btn admin-btn-small admin-confirm-cancel"
            onClick={() => onAnswer(false)}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={
              'admin-btn admin-btn-small ' +
              (danger ? 'admin-confirm-danger' : 'admin-confirm-primary')
            }
            onClick={() => onAnswer(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────
export default function AdminFeedbackProvider({ children }) {
  // Toasts: append-only queue; each has an id and a scheduled dismiss.
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const to = timeoutsRef.current.get(id);
    if (to) {
      clearTimeout(to);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (kind, message, opts = {}) => {
      if (!message) return;
      const id =
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2));
      setToasts((list) => [...list, { id, kind, message: String(message) }]);
      const ms =
        opts.duration ??
        (kind === 'error' ? ERROR_TOAST_MS : DEFAULT_TOAST_MS);
      if (ms > 0) {
        const handle = setTimeout(() => dismiss(id), ms);
        timeoutsRef.current.set(id, handle);
      }
    },
    [dismiss]
  );

  // Cleanup any pending timers on unmount.
  useEffect(
    () => () => {
      timeoutsRef.current.forEach((h) => clearTimeout(h));
      timeoutsRef.current.clear();
    },
    []
  );

  const toastApi = useMemo(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      info: (m, o) => push('info', m, o),
    }),
    [push]
  );

  // Confirm: single active dialog at a time (queueing isn't worth the
  // complexity; no current call site needs it).
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ ...opts, _resolve: resolve });
    });
  }, []);

  const answerConfirm = useCallback(
    (ok) => {
      setConfirmState((curr) => {
        if (curr && typeof curr._resolve === 'function') curr._resolve(ok);
        return null;
      });
    },
    []
  );

  return (
    <ToastCtx.Provider value={toastApi}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
        <ConfirmDialog state={confirmState} onAnswer={answerConfirm} />
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
