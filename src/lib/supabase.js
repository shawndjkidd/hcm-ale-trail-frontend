import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Trail ID for HCM Ale Trail
export const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a92e';

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

// Get participant's check-ins (returns empty for now - we'll add sync later)
export async function getParticipantCheckins(participantId) {
  return { data: [], error: null };
}

// Record a check-in (stamp) - saves to Supabase
export async function recordCheckin(participantId, breweryDisplayOrder, method = 'qr_scan') {
  // For now, just log it - we'll connect to real brewery IDs later
  console.log('Recording checkin:', { participantId, breweryDisplayOrder, method });
  return { data: null, error: null, isExisting: false };
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