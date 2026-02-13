import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Trail ID for HCM Ale Trail
export const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a92e';

// Cache for brewery ID mapping
let breweryCache = null;

// Get breweries from Supabase
export async function getBreweries() {
  const { data, error } = await supabase
    .from('breweries')
    .select('*')
    .eq('trail_id', TRAIL_ID)
    .order('display_order', { ascending: true });
  
  if (data) {
    breweryCache = data;
  }
  
  return { data, error };
}

// Get brewery UUID from display_order (1-8)
export async function getBreweryUUID(displayOrder) {
  if (!breweryCache) {
    await getBreweries();
  }
  
  const brewery = breweryCache?.find(b => b.display_order === displayOrder);
  return brewery?.id || null;
}

// Get display_order from brewery UUID
export async function getBreweryDisplayOrder(breweryId) {
  if (!breweryCache) {
    await getBreweries();
  }
  
  const brewery = breweryCache?.find(b => b.id === breweryId);
  return brewery?.display_order || null;
}

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
export async function recordCheckin(participantId, displayOrder, method = 'qr_scan') {
  // Get the brewery UUID from display_order
  const breweryId = await getBreweryUUID(displayOrder);
  
  if (!breweryId) {
    console.log('Could not find brewery for display_order:', displayOrder);
    return { data: null, error: { message: 'Brewery not found' }, isExisting: false };
  }
  
  // Check if already checked in
  const { data: existingCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('participant_id', participantId)
    .eq('brewery_id', breweryId);
  
  if (existingCheckins && existingCheckins.length > 0) {
    return { data: existingCheckins[0], error: null, isExisting: true };
  }
  
  // Create new check-in
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

// Get participant's check-ins and return as display_order array
export async function getParticipantCheckins(participantId) {
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('*, breweries(display_order, name)')
    .eq('participant_id', participantId);
  
  if (error || !checkins) {
    return { data: [], error };
  }
  
  // Convert to array of display_order numbers (1-8)
  const stamps = checkins
    .map(c => c.breweries?.display_order)
    .filter(d => d !== null && d !== undefined);
  
  return { data: stamps, error: null };
}

// Save a beer rating
export async function saveBeerRating(participantId, displayOrder, beerName, rating, notes = null) {
  const breweryId = await getBreweryUUID(displayOrder);
  
  if (!breweryId) {
    return { data: null, error: { message: 'Brewery not found' } };
  }
  
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
  const { data: participants, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase());
  
  if (participants && participants.length > 0) {
    return { data: participants[0], error: null };
  }
  
  return { data: null, error };
}