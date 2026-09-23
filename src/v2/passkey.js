import { supabase } from '../lib/supabase';
import { storeLoginTokens } from '../lib/api';

export const passkeySupported = () =>
  typeof window !== 'undefined' && !!window.PublicKeyCredential && typeof supabase.auth.registerPasskey === 'function';

export async function listPasskeys() {
  try {
    const { data } = await supabase.auth.passkey.list();
    return data || [];
  } catch {
    return [];
  }
}

// Register a passkey for the signed-in user (needs a live Supabase session).
export async function addPasskey() {
  const { data, error } = await supabase.auth.registerPasskey();
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, passkey: data };
}

// Sign in with a passkey; mirrors the tokens into the app's own storage.
export async function passkeySignIn() {
  const { data, error } = await supabase.auth.signInWithPasskey();
  if (error || !data?.session) return { ok: false, error: error?.message, code: error?.code };
  storeLoginTokens({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  });
  return { ok: true, user: data.user || data.session.user };
}
