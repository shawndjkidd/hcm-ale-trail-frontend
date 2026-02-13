import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Trail ID for HCM Ale Trail
export const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a92e';

// Register a new participant
export async function registerParticipant(data) {
  const { name, email, dateOfBirth, country } = data;
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  if (existing) {
    return { data: existing, error: null, isExisting: true };
  }
  
  // Extract birth year from date
  const birthYear = new Date(dateOfBirth).getFullYear();
  
  // Create new participant - using actual column names from table
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      trail_id: TRAIL_ID,
      display_name: name,
      email: email.toLowerCase(),
      birth_year: birthYear,
      home_country: country || null,
      country: country || null,
    })
    .select()
    .single();
  
  if (error) {
    console.log('Insert error details:', error);
  }
  
  return { data: participant, error, isExisting: false };
}

// Record a check-in (stamp)
export async function recordCheckin(participantId, breweryId, method = 'qr_scan') {
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('participant_id', participantId)
    .eq('brewery_id', breweryId)
    .single();
  
  if (existing) {
    return { data: existing, error: null, isExisting: true };
  }
  
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      participant_id: participantId,
      brewery_id: breweryId,
      trail_id: TRAIL_ID,
      method,
    })
    .select()
    .single();
  
  return { data, error, isExisting: false };
}

// Save a beer rating
export async function saveBeerRating(participantId, breweryId, beerName, rating, notes = null) {
  const { data, error } = await supabase
    .from('beer_ratings')
    .insert({
      participant_id: participantId,
      brewery_id: breweryId,
      beer_name: beerName,
      rating,
      notes,
    })
    .select()
    .single();
  
  return { data, error };
}

// Get participant by email
export async function getParticipantByEmail(email) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  return { data, error };
}

// Get participant's check-ins
export async function getParticipantCheckins(participantId) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*, breweries(name)')
    .eq('participant_id', participantId);
  
  return { data, error };
}