import { createClient } from '@supabase/supabase-js';
import { TRAIL_ID } from '../config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export TRAIL_ID for backwards compatibility
export { TRAIL_ID };

// Map frontend brewery IDs (1-8) to Supabase UUIDs
const BREWERY_MAP = {
  1: '8c3dc4f3-e100-4d63-be0e-ee8b65da8fe8', // BiaCraft
  2: '3f80a715-b664-423d-a04d-3d22fcdeb335', // Heart of Darkness
  3: '6b29d3f2-6b0e-4404-af89-40d7bc7482c5', // Deme
  4: 'c1fb805f-4010-4e8c-85cf-634f6a681308', // Steersman
  5: 'f094c3fc-e07d-4678-919a-923a6b805028', // East West Brewing
  6: '1ba7a599-f91c-425d-98e7-275dd0efbb06', // Rooster Beers
  7: 'd098db66-258b-445e-ad92-c0e769b4270c', // 7 Bridges Brewing Co.
  8: '64393821-1783-4892-8b18-019898d170ce', // Belgo Saigon
};

// Reverse map: UUID to frontend ID
const BREWERY_REVERSE_MAP = Object.fromEntries(
  Object.entries(BREWERY_MAP).map(([k, v]) => [v, parseInt(k)])
);

// Register a new participant
export async function registerParticipant(data) {
  const { name, email, dateOfBirth, country, gender } = data;
  
  // Check if email already exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase());
  
  // If user already exists, return their data
  if (existingUsers && existingUsers.length > 0) {
    return { data: existingUsers[0], error: null, isExisting: true };
  }
  
  // Extract birth year from date
  const birthYear = new Date(dateOfBirth).getFullYear();
  
  // Create new participant
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      trail_id: TRAIL_ID,
      display_name: name,
      email: email.toLowerCase(),
      birth_year: birthYear,
      home_country: country || null,
      country: country || null,
      gender: gender || null,
    })
    .select()
    .single();
  
  if (error) {
    console.log('Insert error details:', error);
  }
  
  return { data: participant, error, isExisting: false };
}

// Record a check-in (stamp)
// frontendBreweryId can be either an integer key (1-8) OR a UUID string from the API
export async function recordCheckin(participantId, frontendBreweryId, method = 'qr_scan') {
  // Try integer key first, then fall back to treating it as a direct UUID
  let breweryUUID = BREWERY_MAP[frontendBreweryId];
  if (!breweryUUID && typeof frontendBreweryId === 'string' && frontendBreweryId.includes('-')) {
    breweryUUID = frontendBreweryId;
  }

  if (!breweryUUID) {
    console.log('Invalid brewery ID:', frontendBreweryId);
    return { data: null, error: { message: 'Invalid brewery ID' }, isExisting: false };
  }

  // Ensure the Supabase client has an active session so RLS auth.uid() resolves.
  // Google OAuth users already have one; email/password users stored their JWT
  // under a custom localStorage key and need it hydrated into the client.
  let authedUid = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      authedUid = session.user.id;
    } else {
      const accessToken = localStorage.getItem('hcm-access-token');
      const refreshToken = localStorage.getItem('hcm-refresh-token');
      if (accessToken && refreshToken) {
        const { data: { session: s } } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authedUid = s?.user?.id ?? null;
      }
    }
  } catch {}

  if (!authedUid) {
    console.log('Check-in fallback skipped: no auth session');
    return { data: null, error: { message: 'No auth session for direct check-in' }, isExisting: false };
  }

  // Check if already checked in — filter by user_id (what the RLS USING policy sees)
  const { data: existingCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', authedUid)
    .eq('brewery_id', breweryUUID);

  if (existingCheckins && existingCheckins.length > 0) {
    return { data: existingCheckins[0], error: null, isExisting: true };
  }

  // Create new check-in; user_id must be set to satisfy RLS WITH CHECK
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      participant_id: participantId,
      brewery_id: breweryUUID,
      trail_id: TRAIL_ID,
      method: method,
      checked_in_at: new Date().toISOString(),
      user_id: authedUid,
    })
    .select()
    .single();

  if (error) {
    console.log('Check-in insert error:', error);
  } else {
    console.log('Check-in saved:', breweryUUID, data);
  }

  return { data, error, isExisting: false };
}

// Get participant's check-ins (returns frontend IDs 1-8)
export async function getParticipantCheckins(participantId) {
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('brewery_id')
    .eq('participant_id', participantId);
  
  if (error || !checkins) {
    return { data: [], error };
  }
  
  // Convert UUIDs to frontend IDs (1-8)
  const stamps = checkins
    .map(c => BREWERY_REVERSE_MAP[c.brewery_id])
    .filter(id => id !== undefined);
  
  return { data: stamps, error: null };
}

// Reset password using a recovery token from a Supabase password-reset email
export async function resetPassword(accessToken, refreshToken, newPassword) {
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) return { ok: false, error: sessionError.message };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// Get participant by email
export async function getParticipantByEmail(email) {
  const { data: participants, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase());
  
  if (participants && participants.length > 0) {
    return { data: participants[0], error: null };
  }
  
  return { data: null, error };
}