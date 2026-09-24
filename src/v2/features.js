// Product/config switches, read from build-time env. Everything here defaults OFF.
//
// VITE_PASSKEYS_ENABLED=true turns on Face ID / passkey sign-in and "Add passkey".
// Leave it unset until Supabase passkeys are configured and tested for this project;
// browser WebAuthn support alone must never show a passkey control.
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export function passkeysEnabled(env = ENV) {
  return String(env?.VITE_PASSKEYS_ENABLED ?? '').trim().toLowerCase() === 'true';
}
