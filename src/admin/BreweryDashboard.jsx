import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getBreweryDashboard, getBreweryEvents, createBreweryEvent, deleteEvent, updateEvent, updateBreweryPin, updateBreweryHours, updateBrewery, getTrailBreweries, getBreweryBeers, createBreweryBeer, updateBreweryBeer, deleteBreweryBeer, bulkUploadBeers, mergeRatings, updateAdminAccount, getBreweryMerchandise, restockMerchandise, getTrailAnalytics, getBreweryStaff, inviteBreweryStaff, updateBreweryStaffRole, removeBreweryStaff, TRAIL_ID } from './adminApi';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_HOURS = {
  monday: { open: '11:00', close: '23:00', closed: false },
  tuesday: { open: '11:00', close: '23:00', closed: false },
  wednesday: { open: '11:00', close: '23:00', closed: false },
  thursday: { open: '11:00', close: '23:00', closed: false },
  friday: { open: '11:00', close: '00:00', closed: false },
  saturday: { open: '11:00', close: '00:00', closed: false },
  sunday: { open: '12:00', close: '22:00', closed: false }
};

export default function BreweryDashboard({ breweryId: propBreweryId, isHQ = false, adminEmail = '', staffRole = null }) {
  const [selectedBreweryId, setSelectedBreweryId] = useState(propBreweryId || '');
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Audience analytics (free tier)
  const [audience, setAudience] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const [pinCode, setPinCode] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [operatingHours, setOperatingHours] = useState(DEFAULT_HOURS);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  const [socialLinks, setSocialLinks] = useState({ mapsUrl: '', instagramUrl: '', facebookUrl: '' });
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');

  const [venueStatus, setVenueStatus] = useState('active');
  const [savingVenueStatus, setSavingVenueStatus] = useState(false);
  const [venueStatusMessage, setVenueStatusMessage] = useState('');

  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionVn, setDescriptionVn] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionMessage, setDescriptionMessage] = useState('');

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', category: 'event' });
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [mergeTargets, setMergeTargets] = useState({}); // key: ratingName -> targetName
  const [mergingKey, setMergingKey] = useState(null);

  const [beers, setBeers] = useState([]);
  const [beersLoading, setBeersLoading] = useState(false);
  const [showBeerForm, setShowBeerForm] = useState(false);
  const [beerForm, setBeerForm] = useState({ name: '', style: '', abv: '' });
  const [savingBeer, setSavingBeer] = useState(false);
  const [editingBeer, setEditingBeer] = useState(null); // beer object being edited
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkParsed, setBulkParsed] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Team / Staff
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteResult, setInviteResult] = useState(null); // { email, tempPassword } | null

  // Merchandise / Stock
  const [brewMerch, setBrewMerch] = useState([]);
  const [brewRestocks, setBrewRestocks] = useState([]);
  const [merchLoading, setMerchLoading] = useState(false);
  const [showBrewRestockModal, setShowBrewRestockModal] = useState(false);
  const [brewRestockForm, setBrewRestockForm] = useState({ merchId: null, quantity: '', notes: '' });
  const [brewRestocking, setBrewRestocking] = useState(false);

  const breweryId = propBreweryId || selectedBreweryId;

  useEffect(() => {
    if (isHQ) {
      getTrailBreweries(TRAIL_ID).then(result => {
        if (result.ok) {
          setBreweries(result.breweries || []);
          if (!selectedBreweryId && result.breweries?.length > 0) {
            setSelectedBreweryId(result.breweries[0].id);
          }
        }
      });
    }
  }, [isHQ]);

  const loadData = async (from, to) => {
    if (!breweryId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [dashResult, eventsResult, beersResult] = await Promise.all([
      getBreweryDashboard(breweryId, from, to),
      getBreweryEvents(breweryId),
      getBreweryBeers(breweryId),
    ]);
    if (dashResult.ok) {
      setData(dashResult);
      setPinCode(dashResult.brewery?.pinCode || dashResult.brewery?.pin_code || '');
      const hours = dashResult.brewery?.operatingHours || dashResult.brewery?.operating_hours;
      if (hours) {
        setOperatingHours({ ...DEFAULT_HOURS, ...hours });
      }
      setSocialLinks({
        mapsUrl: dashResult.brewery?.maps_url || dashResult.brewery?.mapsUrl || '',
        instagramUrl: dashResult.brewery?.instagram_url || dashResult.brewery?.instagramUrl || '',
        facebookUrl: dashResult.brewery?.facebook_url || dashResult.brewery?.facebookUrl || '',
      });
      setVenueStatus(dashResult.brewery?.status || 'active');
      const desc = dashResult.brewery?.description || {};
      setDescriptionEn(typeof desc === 'string' ? desc : (desc.en || ''));
      setDescriptionVn(typeof desc === 'string' ? '' : (desc.vn || ''));
    } else {
      setError(dashResult.error || 'Failed to load data');
    }
    if (eventsResult.ok) setEvents(eventsResult.events || []);
    if (beersResult.ok) setBeers(beersResult.beers || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!breweryId) return;
    let from, to;
    const now = new Date();
    to = now.toISOString();
    if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    loadData(from, to);
  }, [breweryId, dateRange]);

  const handleSavePin = async () => {
    if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }
    setSavingPin(true);
    setPinMessage('');
    const result = await updateBreweryPin(breweryId, pinCode);
    if (result.ok) {
      setPinMessage('✓ PIN updated successfully');
      setTimeout(() => setPinMessage(''), 3000);
    } else {
      setPinMessage(result.error || 'Failed to update PIN');
    }
    setSavingPin(false);
  };

  const handleGenerateQrCode = async () => {
    setGeneratingQr(true);
    try {
      const url = `${window.location.origin}/checkin/${breweryId}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
      setQrCodeUrl(dataUrl);
    } catch (err) {
      alert('Failed to generate QR code');
    }
    setGeneratingQr(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailMessage('Please enter a valid email address');
      return;
    }
    setSavingEmail(true);
    setEmailMessage('');
    const result = await updateAdminAccount({ email: newEmail });
    if (result.ok) {
      setEmailMessage('✓ Email updated. Please log out and log back in.');
      setNewEmail('');
      setTimeout(() => setEmailMessage(''), 5000);
    } else {
      setEmailMessage(result.error || 'Failed to update email');
    }
    setSavingEmail(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    setPasswordMessage('');
    const result = await updateAdminAccount({ currentPassword, password: newPassword });
    if (result.ok) {
      setPasswordMessage('✓ Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 5000);
    } else {
      setPasswordMessage(result.error || 'Failed to update password');
    }
    setSavingPassword(false);
  };

  const handleHoursChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleToggleClosed = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
  };

  const handleSaveSocial = async () => {
    setSavingSocial(true);
    setSocialMessage('');
    const result = await updateBrewery(breweryId, {
      maps_url: socialLinks.mapsUrl || null,
      instagram_url: socialLinks.instagramUrl || null,
      facebook_url: socialLinks.facebookUrl || null,
    });
    if (result.ok) {
      setSocialMessage('✓ Social links updated');
      setTimeout(() => setSocialMessage(''), 3000);
    } else {
      setSocialMessage(result.error || 'Failed to update');
    }
    setSavingSocial(false);
  };

  const handleSaveDescription = async () => {
    setSavingDescription(true);
    setDescriptionMessage('');
    const result = await updateBrewery(breweryId, {
      description: { en: descriptionEn.trim(), vn: descriptionVn.trim() || descriptionEn.trim() },
    });
    if (result.ok) {
      setDescriptionMessage('✓ Description updated');
      setTimeout(() => setDescriptionMessage(''), 3000);
    } else {
      setDescriptionMessage(result.error || 'Failed to update');
    }
    setSavingDescription(false);
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    setHoursMessage('');
    const result = await updateBreweryHours(breweryId, operatingHours);
    if (result.ok) {
      setHoursMessage('✓ Hours updated successfully');
      setTimeout(() => setHoursMessage(''), 3000);
    } else {
      setHoursMessage(result.error || 'Failed to update hours');
    }
    setSavingHours(false);
  };

  const handleToggleVenueStatus = async () => {
    const newStatus = venueStatus === 'temporarily_closed' ? 'active' : 'temporarily_closed';
    setSavingVenueStatus(true);
    setVenueStatusMessage('');
    const result = await updateBrewery(breweryId, { status: newStatus });
    if (result.ok) {
      setVenueStatus(newStatus);
      setVenueStatusMessage(newStatus === 'temporarily_closed' ? '✓ Marked as temporarily closed' : '✓ Marked as active');
      setTimeout(() => setVenueStatusMessage(''), 3000);
    } else {
      setVenueStatusMessage(result.error || 'Failed to update status');
    }
    setSavingVenueStatus(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const result = await deleteEvent(eventId);
    if (result.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert(result.error || 'Failed to delete');
  };

  const handleCreateEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      alert('Title (English) and Start Date/Time are required');
      return;
    }
    setSavingEvent(true);
    const eventData = {
      trail_id: TRAIL_ID,
      title: { en: eventForm.titleEn, vn: eventForm.titleVn || eventForm.titleEn },
      description: eventForm.descriptionEn ? { en: eventForm.descriptionEn, vn: eventForm.descriptionVn || eventForm.descriptionEn } : null,
      starts_at: new Date(eventForm.startsAt).toISOString(),
      ends_at: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
      link: eventForm.link || null,
      status: 'active',
      category: eventForm.category || 'event'
    };
    const result = await createBreweryEvent(breweryId, eventData);
    if (result.ok) {
      setEvents([...events, result.event]);
      setShowEventForm(false);
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', category: 'event' });
    } else {
      alert(result.error || 'Failed to create event');
    }
    setSavingEvent(false);
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', category: 'event' });
    setShowEventForm(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    const titleObj = event.title || {};
    const descObj = event.description || {};
    // Convert ISO datetime to local datetime-local format
    const toLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    };
    setEventForm({
      titleEn: typeof titleObj === 'string' ? titleObj : (titleObj.en || ''),
      titleVn: typeof titleObj === 'string' ? '' : (titleObj.vn || ''),
      descriptionEn: typeof descObj === 'string' ? descObj : (descObj.en || ''),
      descriptionVn: typeof descObj === 'string' ? '' : (descObj.vn || ''),
      startsAt: toLocal(event.startsAt),
      endsAt: toLocal(event.endsAt),
      link: event.link || '',
      category: event.category || 'event',
    });
    setShowEventForm(true);
  };

  const handleUpdateEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      alert('Title (English) and Start Date/Time are required');
      return;
    }
    setSavingEvent(true);
    const patch = {
      title: { en: eventForm.titleEn, vn: eventForm.titleVn || eventForm.titleEn },
      description: eventForm.descriptionEn ? { en: eventForm.descriptionEn, vn: eventForm.descriptionVn || eventForm.descriptionEn } : null,
      starts_at: new Date(eventForm.startsAt).toISOString(),
      ends_at: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
      link: eventForm.link || null,
      category: eventForm.category || 'event',
    };
    const result = await updateEvent(editingEvent.id, patch);
    if (result.ok) {
      setEvents(events.map(e => e.id === editingEvent.id ? result.event : e));
      setShowEventForm(false);
      setEditingEvent(null);
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', category: 'event' });
    } else {
      alert(result.error || 'Failed to update event');
    }
    setSavingEvent(false);
  };

  const loadBeers = async () => {
    if (!breweryId) return;
    setBeersLoading(true);
    const result = await getBreweryBeers(breweryId);
    if (result.ok) setBeers(result.beers || []);
    setBeersLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'beers' && breweryId) loadBeers();
  }, [activeTab, breweryId]);

  const loadMerch = async () => {
    if (!breweryId) return;
    setMerchLoading(true);
    const result = await getBreweryMerchandise(breweryId);
    if (result.ok) {
      setBrewMerch(result.merchandise || []);
      setBrewRestocks(result.recentRestocks || []);
    }
    setMerchLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'stock' && breweryId) loadMerch();
  }, [activeTab, breweryId]);

  const loadStaff = async () => {
    if (!breweryId) return;
    setStaffLoading(true);
    const result = await getBreweryStaff(breweryId);
    if (result.ok) setStaff(result.staff || []);
    setStaffLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'team' && breweryId) loadStaff();
  }, [activeTab, breweryId]);

  const handleInviteStaff = async () => {
    setInviteError('');
    if (!inviteEmail.trim()) { setInviteError('Email is required'); return; }
    setInviting(true);
    const result = await inviteBreweryStaff(breweryId, inviteEmail.trim(), inviteRole);
    if (result.ok) {
      setStaff(prev => [...prev, result.staff]);
      setShowInviteModal(false);
      setInviteResult({ email: inviteEmail.trim(), tempPassword: result.tempPassword || null });
      setInviteEmail('');
      setInviteRole('staff');
    } else {
      setInviteError(result.error || 'Invite failed');
    }
    setInviting(false);
  };

  const handleUpdateStaffRole = async (staffId, newRole) => {
    const result = await updateBreweryStaffRole(breweryId, staffId, newRole);
    if (result.ok) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, role: newRole } : s));
    } else {
      alert(result.error || 'Failed to update role');
    }
  };

  const handleRemoveStaff = async (staffId, email) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    const result = await removeBreweryStaff(breweryId, staffId);
    if (result.ok) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
    } else {
      alert(result.error || 'Failed to remove');
    }
  };

  const handleBrewRestockSubmit = async () => {
    const qty = Number(brewRestockForm.quantity);
    if (!qty || qty <= 0) return;
    setBrewRestocking(true);
    const result = await restockMerchandise(breweryId, brewRestockForm.merchId, qty, brewRestockForm.notes);
    if (result.ok) {
      await loadMerch();
      setShowBrewRestockModal(false);
      setBrewRestockForm({ merchId: null, quantity: '', notes: '' });
    } else {
      alert(result.error || 'Failed to restock');
    }
    setBrewRestocking(false);
  };

  const handleCreateBeer = async () => {
    if (!beerForm.name.trim()) {
      alert('Beer name is required');
      return;
    }
    setSavingBeer(true);
    const result = await createBreweryBeer(breweryId, {
      name: beerForm.name.trim(),
      style: beerForm.style.trim() || null,
      abv: beerForm.abv !== '' ? parseFloat(beerForm.abv) : null,
    });
    if (result.ok) {
      setBeers(prev => [...prev, result.beer].sort((a, b) => a.name.localeCompare(b.name)));
      setShowBeerForm(false);
      setBeerForm({ name: '', style: '', abv: '' });
    } else {
      alert(result.error || 'Failed to create beer');
    }
    setSavingBeer(false);
  };

  const handleUpdateBeer = async () => {
    if (!beerForm.name.trim()) {
      alert('Beer name is required');
      return;
    }
    setSavingBeer(true);
    const result = await updateBreweryBeer(breweryId, editingBeer.id, {
      name: beerForm.name.trim(),
      style: beerForm.style.trim() || null,
      abv: beerForm.abv !== '' ? parseFloat(beerForm.abv) : null,
    });
    if (result.ok) {
      setBeers(prev => prev.map(b => b.id === editingBeer.id ? result.beer : b).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingBeer(null);
      setShowBeerForm(false);
      setBeerForm({ name: '', style: '', abv: '' });
    } else {
      alert(result.error || 'Failed to update beer');
    }
    setSavingBeer(false);
  };

  const handleDeleteBeer = async (beer) => {
    if (!confirm(`Remove "${beer.name}" from the menu?`)) return;
    const result = await deleteBreweryBeer(breweryId, beer.id);
    if (result.ok) {
      setBeers(prev => prev.filter(b => b.id !== beer.id));
    } else {
      alert(result.error || 'Failed to remove beer');
    }
  };

  const openEditBeer = (beer) => {
    setEditingBeer(beer);
    setBeerForm({ name: beer.name, style: beer.style || '', abv: beer.abv != null ? String(beer.abv) : '' });
    setShowBeerForm(true);
  };

  const closeBeerForm = () => {
    setShowBeerForm(false);
    setEditingBeer(null);
    setBeerForm({ name: '', style: '', abv: '' });
  };

  const parseBulkText = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    // Detect separator: tab or comma
    const sep = lines[0].includes('\t') ? '\t' : ',';
    // Check if first line is a header
    const firstCols = lines[0].split(sep).map(s => s.trim().toLowerCase());
    const isHeader = firstCols.some(c => ['name', 'beer', 'beer name', 'style', 'abv'].includes(c));
    const dataLines = isHeader ? lines.slice(1) : lines;
    return dataLines.map(line => {
      const cols = line.split(sep).map(s => s.trim());
      return {
        name: cols[0] || '',
        style: cols[1] || '',
        abv: cols[2] || '',
      };
    }).filter(b => b.name);
  };

  const handleBulkTextChange = (text) => {
    setBulkText(text);
    setBulkParsed(parseBulkText(text));
  };

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result || '';
      setBulkText(text);
      setBulkParsed(parseBulkText(text));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkSubmit = async () => {
    if (bulkParsed.length === 0) return;
    setBulkUploading(true);
    const result = await bulkUploadBeers(breweryId, bulkParsed.map(b => ({
      name: b.name,
      style: b.style || null,
      abv: b.abv !== '' ? parseFloat(b.abv) : null,
    })));
    if (result.ok) {
      setBeers(prev => [...prev, ...(result.beers || [])].sort((a, b) => a.name.localeCompare(b.name)));
      setShowBulkUpload(false);
      setBulkText('');
      setBulkParsed([]);
      alert(`Successfully added ${result.count} beer${result.count !== 1 ? 's' : ''}!`);
    } else {
      alert(result.error || 'Bulk upload failed');
    }
    setBulkUploading(false);
  };

  const handleMergeRating = async (oldName) => {
    const target = mergeTargets[oldName];
    if (!target) return;
    setMergingKey(oldName);
    const result = await mergeRatings(breweryId, oldName, target);
    if (result.ok) {
      // Refresh dashboard data to update ratings
      let from, to;
      const now = new Date();
      to = now.toISOString();
      if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      await loadData(from, to);
      setMergeTargets(prev => { const n = { ...prev }; delete n[oldName]; return n; });
    } else {
      alert(result.error || 'Merge failed');
    }
    setMergingKey(null);
  };

  // Aggregate beer ratings from latest ratings
  const getBeerRatings = () => {
    const latest = data?.ratings?.latest || [];
    const beerMap = {};
    latest.forEach(r => {
      const name = r.beer_name || r.beerName || 'Unknown Beer';
      if (!beerMap[name]) {
        beerMap[name] = { totalRating: 0, count: 0, ratings: [] };
      }
      beerMap[name].totalRating += r.rating;
      beerMap[name].count += 1;
      beerMap[name].ratings.push(r);
    });
    return Object.entries(beerMap)
      .map(([name, data]) => ({
        beerName: name,
        avgRating: data.totalRating / data.count,
        count: data.count,
        ratings: data.ratings
      }))
      .sort((a, b) => b.avgRating - a.avgRating);
  };

  if (isHQ && !breweryId && breweries.length === 0) {
    return <div className="admin-content"><div className="admin-loading"><div className="admin-spinner" /></div></div>;
  }

  if (loading && !data) {
    return (
      <div className="admin-content">
        {isHQ && (
          <div style={{ marginBottom: 20 }}>
            <label className="admin-form-label">Select Brewery</label>
            <select className="admin-form-input" style={{ maxWidth: 300 }} value={selectedBreweryId} onChange={(e) => setSelectedBreweryId(e.target.value)}>
              {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="admin-loading"><div className="admin-spinner" /></div>
      </div>
    );
  }

  if (error && !data) {
    return <div className="admin-content"><div className="admin-error">{error}</div></div>;
  }

  const brewery = data?.brewery || {};
  const totals = data?.totals || {};
  const ratings = data?.ratings || {};
  const ranking = data?.ranking || {};
  const checkinsByBrewery = data?.checkinsByBrewery || [];
  const journeyStats = data?.journeyStats || {};
  const beerRatings = getBeerRatings();

  return (
    <div className="admin-content">
      {isHQ && (
        <div style={{ marginBottom: 20 }}>
          <label className="admin-form-label">Select Brewery</label>
          <select className="admin-form-input" style={{ maxWidth: 300 }} value={selectedBreweryId} onChange={(e) => setSelectedBreweryId(e.target.value)}>
            {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <h1 className="admin-page-title">{brewery.name || 'Brewery'} Dashboard</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'ratings' ? 'active' : ''}`} onClick={() => setActiveTab('ratings')}>Beer Ratings</button>
        <button className={`admin-tab ${activeTab === 'competition' ? 'active' : ''}`} onClick={() => setActiveTab('competition')}>Trail Competition</button>
        <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
        <button className={`admin-tab ${activeTab === 'beers' ? 'active' : ''}`} onClick={() => setActiveTab('beers')}>Beer Menu</button>
        <button className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Stock{brewMerch.some(m => m.lowStock) ? ' ⚠️' : ''}</button>
        <button className={`admin-tab ${activeTab === 'audience' ? 'active' : ''}`} onClick={() => {
          setActiveTab('audience');
          if (!audience && !audienceLoading) {
            setAudienceLoading(true);
            getTrailAnalytics(TRAIL_ID, 'brewery', brewery.id).then(res => {
              if (res.ok) setAudience(res);
              setAudienceLoading(false);
            });
          }
        }}>Audience</button>
        {(staffRole === 'owner' || staffRole === 'manager') && (
          <button className={`admin-tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Team</button>
        )}
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card"><div className="admin-kpi-label">Total Check-ins</div><div className="admin-kpi-value primary">{totals.checkins || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Trail Rank</div><div className="admin-kpi-value primary">{ranking.rank || '--'}<span style={{ fontSize: 14, color: 'var(--admin-text-muted)' }}> / {ranking.total || '--'}</span></div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Avg Beer Rating</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div><div className="admin-kpi-subtext">{ratings.countVenue || 0} ratings</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Hat Claims Here</div><div className="admin-kpi-value success">{journeyStats.hatClaimsHere || 0}</div></div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card"><h3 className="admin-card-title">Started Here</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.startedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>participants began their trail here</div></div>
            <div className="admin-card"><h3 className="admin-card-title">Ended Here</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.endedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>participants finished their trail here</div></div>
            <div className="admin-card"><h3 className="admin-card-title">Hat Claims</h3><div className="admin-kpi-value success" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.hatClaimsHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>hats claimed at this location</div></div>
          </div>

          {beerRatings.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-card-title">Top Rated Beers</h3>
              <table className="admin-table"><thead><tr><th>Beer</th><th>Avg Rating</th><th># Ratings</th></tr></thead><tbody>
                {beerRatings.slice(0, 5).map((beer, i) => (
                  <tr key={i}><td><strong>{beer.beerName}</strong></td><td>{beer.avgRating.toFixed(2)}★</td><td>{beer.count}</td></tr>
                ))}
              </tbody></table>
            </div>
          )}
        </>
      )}

      {activeTab === 'ratings' && (
        <>
          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Rating Summary</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Overall Avg</div><div className="admin-kpi-value primary">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Total Ratings</div><div className="admin-kpi-value">{ratings.countVenue || 0}</div></div>
              </div>
              {beerRatings.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Highest Rated</span>
                    <span><strong>{beerRatings[0].beerName}</strong> ({beerRatings[0].avgRating.toFixed(2)}★)</span>
                  </div>
                  {beerRatings.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--admin-text-muted)' }}>Lowest Rated</span>
                      <span><strong>{beerRatings[beerRatings.length - 1].beerName}</strong> ({beerRatings[beerRatings.length - 1].avgRating.toFixed(2)}★)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Trail Comparison</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Your Avg</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Trail Avg</div><div className="admin-kpi-value">{ratings.avgRatingTrail?.toFixed(1) || '--'}★</div></div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">All Beer Ratings</h3>
            {beerRatings.length === 0 ? (<div className="admin-empty">No beer ratings yet</div>) : (
              <table className="admin-table"><thead><tr><th>Beer</th><th>Avg Rating</th><th># Ratings</th></tr></thead><tbody>
                {beerRatings.map((beer, i) => (
                  <tr key={i}>
                    <td><strong>{beer.beerName}</strong></td>
                    <td><span style={{ color: beer.avgRating >= 4 ? 'var(--admin-success)' : beer.avgRating >= 3 ? 'var(--admin-warning)' : 'var(--admin-danger)' }}>{beer.avgRating.toFixed(2)}★</span></td>
                    <td>{beer.count}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Recent Reviews</h3>
            {(ratings.latest || []).length === 0 ? (<div className="admin-empty">No reviews yet</div>) : (
              <div>
                {(ratings.latest || []).map((r, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < ratings.latest.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{r.beer_name || r.beerName}</strong>
                      <span style={{ color: r.rating >= 4 ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>{r.rating}★</span>
                    </div>
                    {r.notes && <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, fontStyle: 'italic' }}>"{r.notes}"</div>}
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>{new Date(r.created_at || r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(() => {
            const activeMenuNames = new Set(beers.filter(b => b.active !== false).map(b => b.name.toLowerCase()));
            const unmatched = beerRatings.filter(r => !activeMenuNames.has(r.beerName.toLowerCase()));
            if (activeMenuNames.size === 0 || unmatched.length === 0) return null;
            const menuOptions = beers.filter(b => b.active !== false);
            return (
              <div className="admin-card">
                <h3 className="admin-card-title">Merge Ratings</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  These submitted beer names don't match your menu. Reassign them to the correct menu entry to keep ratings clean.
                </p>
                <table className="admin-table">
                  <thead><tr><th>Submitted Name</th><th># Ratings</th><th>Reassign to</th><th></th></tr></thead>
                  <tbody>
                    {unmatched.map((r) => (
                      <tr key={r.beerName}>
                        <td><strong style={{ color: 'var(--admin-warning)' }}>{r.beerName}</strong></td>
                        <td>{r.count}</td>
                        <td>
                          <select
                            className="admin-form-input"
                            style={{ margin: 0 }}
                            value={mergeTargets[r.beerName] || ''}
                            onChange={(e) => setMergeTargets(prev => ({ ...prev, [r.beerName]: e.target.value }))}
                          >
                            <option value="">— keep as-is —</option>
                            {menuOptions.map(b => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="admin-btn-small admin-btn-primary"
                            disabled={!mergeTargets[r.beerName] || mergingKey === r.beerName}
                            onClick={() => handleMergeRating(r.beerName)}
                          >
                            {mergingKey === r.beerName ? 'Merging...' : 'Merge'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {activeTab === 'competition' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Trail Competition</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>See how you rank against other breweries on the trail.</p>
          {checkinsByBrewery.length === 0 ? (<div className="admin-empty">No data yet</div>) : (
            <table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Check-ins</th></tr></thead><tbody>
              {checkinsByBrewery.sort((a, b) => b.count - a.count).map((b, index) => {
                const isYou = b.breweryId === breweryId;
                return (
                  <tr key={b.breweryId} style={isYou ? { background: 'rgba(249, 115, 22, 0.15)' } : {}}>
                    <td>
                      <span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </span>
                    </td>
                    <td><strong>{b.breweryName}</strong>{isYou && <span style={{ marginLeft: 8, color: 'var(--admin-primary)', fontSize: 12 }}>(You)</span>}</td>
                    <td><strong>{b.count}</strong></td>
                  </tr>
                );
              })}
            </tbody></table>
          )}
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 16 }}>
            💡 More stats coming soon: Hat Claims, Avg Rating, Top Beer per brewery
          </p>
        </div>
      )}

      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <div className="admin-form-group"><label className="admin-form-label">Title (English) *</label><input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Title (Vietnamese)</label><input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description</label><textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Start Date/Time *</label><input type="datetime-local" className="admin-form-input" value={eventForm.startsAt} onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">End Date/Time</label><input type="datetime-local" className="admin-form-input" value={eventForm.endsAt} onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Link</label><input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Category</label><select className="admin-form-input" value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})}><option value="event">Event</option><option value="new_release">New Release</option></select></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button className="admin-btn admin-btn-primary" onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} disabled={savingEvent}>{savingEvent ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}</button><button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>Cancel</button></div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>Events</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={openCreateEvent}>+ Create Event</button></div>
            {events.length === 0 ? (<div className="admin-empty">No events yet</div>) : (
              <table className="admin-table"><thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                {events.map((event) => (
                  <tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td><span className={`admin-badge ${event.category === 'new_release' ? 'success' : 'active'}`}>{event.category === 'new_release' ? '🍺 Release' : '🎉 Event'}</span></td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td><td><div style={{ display: 'flex', gap: 6 }}><button className="admin-btn-small" style={{ background: 'var(--admin-primary)', color: '#fff' }} onClick={() => openEditEvent(event)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></div></td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {activeTab === 'beers' && (
        <>
          {showBeerForm && (
            <div className="admin-modal-overlay" onClick={closeBeerForm}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingBeer ? 'Edit Beer' : 'Add Beer'}</h3>
                <div className="admin-form-group">
                  <label className="admin-form-label">Beer Name *</label>
                  <input type="text" className="admin-form-input" value={beerForm.name} onChange={(e) => setBeerForm({ ...beerForm, name: e.target.value })} placeholder="e.g. Saigon IPA" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Style</label>
                  <input type="text" className="admin-form-input" value={beerForm.style} onChange={(e) => setBeerForm({ ...beerForm, style: e.target.value })} placeholder="e.g. IPA, Stout, Lager" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">ABV (%)</label>
                  <input type="number" className="admin-form-input" style={{ maxWidth: 120 }} value={beerForm.abv} onChange={(e) => setBeerForm({ ...beerForm, abv: e.target.value })} placeholder="e.g. 5.5" step="0.1" min="0" max="100" />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={editingBeer ? handleUpdateBeer : handleCreateBeer} disabled={savingBeer}>
                    {savingBeer ? 'Saving...' : editingBeer ? 'Save Changes' : 'Add Beer'}
                  </button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={closeBeerForm}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {showBulkUpload && (
            <div className="admin-modal-overlay" onClick={() => setShowBulkUpload(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <h3 style={{ marginBottom: 8 }}>Bulk Import Beers</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  Add multiple beers at once. Upload a CSV file or paste data from a spreadsheet. Format: <strong>Name, Style, ABV</strong> (one beer per line). Style and ABV are optional.
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <label className="admin-btn admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)', cursor: 'pointer', margin: 0 }}>
                    📄 Choose CSV File
                    <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvFile} style={{ display: 'none' }} />
                  </label>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, alignSelf: 'center' }}>or paste below</span>
                </div>
                <textarea
                  className="admin-form-input"
                  rows={8}
                  value={bulkText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  placeholder={"Saigon IPA, IPA, 6.5\nMidnight Stout, Stout, 5.2\nLemongrass Lager, Lager, 4.8"}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
                {bulkParsed.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Preview ({bulkParsed.length} beer{bulkParsed.length !== 1 ? 's' : ''} found):</p>
                    <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--admin-border)', borderRadius: 4 }}>
                      <table className="admin-table" style={{ margin: 0 }}>
                        <thead><tr><th>Name</th><th>Style</th><th>ABV</th></tr></thead>
                        <tbody>
                          {bulkParsed.map((b, i) => (
                            <tr key={i}><td>{b.name}</td><td style={{ color: 'var(--admin-text-muted)' }}>{b.style || '—'}</td><td style={{ color: 'var(--admin-text-muted)' }}>{b.abv || '—'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={handleBulkSubmit} disabled={bulkUploading || bulkParsed.length === 0}>
                    {bulkUploading ? 'Uploading...' : `Import ${bulkParsed.length} Beer${bulkParsed.length !== 1 ? 's' : ''}`}
                  </button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowBulkUpload(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Beer Menu</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowBulkUpload(true)}>↑ Bulk Import</button>
                <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => setShowBeerForm(true)}>+ Add Beer</button>
              </div>
            </div>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              These beers appear as options in the app's beer rating dropdown. Customers can still type a custom name if theirs isn't listed.
            </p>
            {beersLoading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : beers.filter(b => b.active !== false).length === 0 ? (
              <div className="admin-empty">No beers on the menu yet. Add your first beer!</div>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Beer</th><th>Style</th><th>ABV</th><th>Actions</th></tr></thead>
                <tbody>
                  {beers.filter(b => b.active !== false).map((beer) => (
                    <tr key={beer.id}>
                      <td><strong>{beer.name}</strong></td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{beer.style || '—'}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{beer.abv != null ? `${beer.abv}%` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => openEditBeer(beer)}>Edit</button>
                          <button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteBeer(beer)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'team' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>Team Members</h2>
            {staffRole === 'owner' && (
              <button
                className="admin-btn admin-btn-primary settings-btn"
                onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteEmail(''); setInviteRole('staff'); setInviteResult(null); }}
              >
                + Add Member
              </button>
            )}
          </div>

          {inviteResult && (
            <div style={{
              background: 'rgba(107, 142, 107, 0.15)',
              border: '1px solid var(--admin-success)',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 16,
              position: 'relative',
            }}>
              <button
                onClick={() => setInviteResult(null)}
                style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              >✕</button>
              <div style={{ fontWeight: 700, color: 'var(--admin-success-light)', marginBottom: 6 }}>
                ✓ Account created for {inviteResult.email}
              </div>
              {inviteResult.tempPassword ? (
                <>
                  <div style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 4 }}>
                    Temporary password:{' '}
                    <code style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: 'var(--admin-text)',
                    }}>
                      {inviteResult.tempPassword}
                    </code>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Share this with them to log in. They should change their password after first login.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  They already have an account and have been added to the team.
                </div>
              )}
            </div>
          )}

          {staffLoading ? (
            <div className="admin-loading"><div className="admin-spinner" /></div>
          ) : (
            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Since</th>
                    {staffRole === 'owner' && <th style={{ width: 90 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={staffRole === 'owner' ? 5 : 4} style={{ color: 'var(--admin-text-muted)', padding: '16px 12px', fontSize: 14 }}>
                        No team members yet.
                      </td>
                    </tr>
                  )}
                  {staff.map(member => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>
                        {member.email}
                        {member.email === adminEmail && (
                          <span className="admin-pill" style={{ marginLeft: 8, verticalAlign: 'middle' }}>you</span>
                        )}
                      </td>
                      <td>
                        {staffRole === 'owner' && member.email !== adminEmail ? (
                          <select
                            className="admin-select"
                            value={member.role}
                            onChange={e => handleUpdateStaffRole(member.id, e.target.value)}
                          >
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        ) : (
                          <span className={`admin-pill ${member.role === 'owner' ? 'admin-pill-success' : member.role === 'manager' ? 'admin-pill-warning' : ''}`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-pill ${member.status === 'active' ? 'admin-pill-success' : 'admin-pill-warning'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                        {member.invitedAt ? new Date(member.invitedAt).toLocaleDateString() : '—'}
                      </td>
                      {staffRole === 'owner' && (
                        <td>
                          {member.email !== adminEmail ? (
                            <button
                              className="admin-btn admin-btn-danger"
                              onClick={() => handleRemoveStaff(member.id, member.email)}
                            >
                              Remove
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showInviteModal && (
            <div className="admin-modal-backdrop" onMouseDown={() => setShowInviteModal(false)}>
              <div className="admin-modal" onMouseDown={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <div className="admin-modal-title">Invite Team Member</div>
                  <button className="admin-btn-ghost" onClick={() => setShowInviteModal(false)}>✕</button>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Email address</label>
                  <input
                    className="admin-form-input"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="staff@example.com"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleInviteStaff()}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Role</label>
                  <select
                    className="admin-form-input"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="staff">Staff — view-only access</option>
                    <option value="manager">Manager — edit settings, events, beer menu</option>
                    <option value="owner">Owner — full access including team management</option>
                  </select>
                </div>

                {inviteError && <div className="admin-error">{inviteError}</div>}

                <div className="admin-form-actions">
                  <button className="admin-btn settings-btn" onClick={() => setShowInviteModal(false)} disabled={inviting}>
                    Cancel
                  </button>
                  <button className="admin-btn admin-btn-primary settings-btn" onClick={handleInviteStaff} disabled={inviting}>
                    {inviting ? 'Inviting…' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="admin-settings-grid">
          {/* Left column: Venue Status, Social Links, Operating Hours */}
          <div>
          <div className="admin-card" style={{ borderLeft: venueStatus === 'temporarily_closed' ? '4px solid var(--admin-danger)' : '4px solid var(--admin-success)' }}>
            <h3 className="admin-card-title">Venue Status</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>
              {venueStatus === 'temporarily_closed'
                ? '🔴 This venue is currently marked as temporarily closed. Visitors will see a closure notice in the app.'
                : '🟢 This venue is active and accepting check-ins.'}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className={`admin-btn ${venueStatus === 'temporarily_closed' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                onClick={handleToggleVenueStatus}
                disabled={savingVenueStatus}
              >
                {savingVenueStatus ? 'Saving...' : venueStatus === 'temporarily_closed' ? 'Mark as Active' : 'Mark as Temporarily Closed'}
              </button>
              {venueStatusMessage && <span style={{ fontSize: 13, color: venueStatusMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{venueStatusMessage}</span>}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Social Links</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>These appear as buttons on your venue page in the app.</p>
            <div className="admin-form-group">
              <label className="admin-form-label">Google Maps URL</label>
              <input type="url" className="admin-form-input" value={socialLinks.mapsUrl} onChange={(e) => setSocialLinks(prev => ({ ...prev, mapsUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Instagram URL</label>
              <input type="url" className="admin-form-input" value={socialLinks.instagramUrl} onChange={(e) => setSocialLinks(prev => ({ ...prev, instagramUrl: e.target.value }))} placeholder="https://instagram.com/yourvenue" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Facebook URL</label>
              <input type="url" className="admin-form-input" value={socialLinks.facebookUrl} onChange={(e) => setSocialLinks(prev => ({ ...prev, facebookUrl: e.target.value }))} placeholder="https://facebook.com/yourvenue" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSaveSocial} disabled={savingSocial}>
                {savingSocial ? 'Saving...' : 'Save Links'}
              </button>
              {socialMessage && <span style={{ fontSize: 13, color: socialMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{socialMessage}</span>}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Operating Hours</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>Set your weekly operating hours.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {DAY_NAMES.map((day, index) => (
                  <tr key={day} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '8px 12px 8px 0', width: 100, fontWeight: 500, fontSize: 14 }}>{DAY_LABELS[index]}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>
                      {operatingHours[day]?.closed ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>Closed</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="time"
                            value={operatingHours[day]?.open || '11:00'}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            style={{ border: '1px solid var(--admin-border)', borderRadius: 4, padding: '3px 6px', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)', colorScheme: 'dark' }}
                          />
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>to</span>
                          <input
                            type="time"
                            value={operatingHours[day]?.close || '23:00'}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            style={{ border: '1px solid var(--admin-border)', borderRadius: 4, padding: '3px 6px', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)', colorScheme: 'dark' }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 0', width: 80, textAlign: 'right' }}>
                      <button
                        className={`admin-btn-small ${operatingHours[day]?.closed ? 'admin-btn-danger' : 'admin-btn-success'}`}
                        onClick={() => handleToggleClosed(day)}
                        style={{ fontSize: 11, padding: '3px 8px' }}
                      >
                        {operatingHours[day]?.closed ? 'Closed' : 'Open'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSaveHours} disabled={savingHours}>
                {savingHours ? 'Saving...' : 'Save Hours'}
              </button>
              {hoursMessage && <span style={{ fontSize: 13, color: hoursMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{hoursMessage}</span>}
            </div>
          </div>
          </div>{/* end left column */}

          {/* Right column: Fallback PIN Code, Venue Description */}
          <div>
          <div className="admin-card">
            <h3 className="admin-card-title">Fallback PIN Code</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>4-digit PIN for manual check-ins when QR fails.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="admin-form-input"
                style={{ width: 90, textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', fontSize: 16 }}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength="4"
                placeholder="1234"
              />
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSavePin} disabled={savingPin}>
                {savingPin ? 'Saving...' : 'Save PIN'}
              </button>
              {pinMessage && <span style={{ fontSize: 13, color: pinMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{pinMessage}</span>}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">QR Code</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>Generate a QR code for guests to scan and check in at your venue.</p>
            {qrCodeUrl ? (
              <>
                <img src={qrCodeUrl} alt="Check-in QR Code" style={{ width: 180, height: 180, imageRendering: 'pixelated', display: 'block', marginBottom: 12 }} />
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 12, wordBreak: 'break-all' }}>{window.location.origin}/checkin/{breweryId}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={qrCodeUrl} download={`checkin-qr-${breweryId}.png`} className="admin-btn admin-btn-secondary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>Download QR</a>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)', width: 'auto' }} onClick={handleGenerateQrCode} disabled={generatingQr}>Regenerate</button>
                </div>
              </>
            ) : (
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleGenerateQrCode} disabled={generatingQr}>
                {generatingQr ? 'Generating...' : 'Generate QR Code'}
              </button>
            )}
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Venue Description</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>Shown on your venue page in the app.</p>
            <div className="admin-form-group">
              <label className="admin-form-label">English</label>
              <textarea className="admin-form-input" rows={3} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Describe this venue..." />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Vietnamese</label>
              <textarea className="admin-form-input" rows={3} value={descriptionVn} onChange={(e) => setDescriptionVn(e.target.value)} placeholder="Mô tả địa điểm..." />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSaveDescription} disabled={savingDescription}>
                {savingDescription ? 'Saving...' : 'Save Description'}
              </button>
              {descriptionMessage && <span style={{ fontSize: 13, color: descriptionMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{descriptionMessage}</span>}
            </div>
          </div>

          {!isHQ && (
          <div className="admin-card">
            <h3 className="admin-card-title">Account Settings</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>Manage your /admin login credentials.</p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Change Email</p>
              {adminEmail && <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>Current: {adminEmail}</p>}
              <div className="admin-form-group">
                <input type="email" className="admin-form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="admin-btn admin-btn-primary settings-btn" onClick={handleUpdateEmail} disabled={savingEmail}>
                  {savingEmail ? 'Saving...' : 'Update Email'}
                </button>
                {emailMessage && <span style={{ fontSize: 13, color: emailMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{emailMessage}</span>}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Change Password</p>
              <div className="admin-form-group">
                <label className="admin-form-label">Current Password</label>
                <input type="password" className="admin-form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">New Password</label>
                <input type="password" className="admin-form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Confirm New Password</label>
                <input type="password" className="admin-form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="admin-btn admin-btn-primary settings-btn" onClick={handleUpdatePassword} disabled={savingPassword}>
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
                {passwordMessage && <span style={{ fontSize: 13, color: passwordMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{passwordMessage}</span>}
              </div>
            </div>
          </div>
          )}

          </div>{/* end right column */}
        </div>
      )}

      {activeTab === 'stock' && (
        <>
          <div className="admin-card">
            <h3 className="admin-card-title">Merchandise Stock</h3>
            {merchLoading ? (
              <p style={{ color: 'var(--admin-text-muted)' }}>Loading stock data...</p>
            ) : brewMerch.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)' }}>No merchandise items configured for this trail yet. Ask HQ to add items.</p>
            ) : (
              <div>
                {brewMerch.map(item => (
                  <div key={item.id} className="admin-card" style={{ marginBottom: 12, background: 'var(--admin-bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{item.name}</h4>
                      {item.lowStock && <span className="admin-badge admin-badge-error">LOW STOCK</span>}
                    </div>
                    {item.description && <p style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0', fontSize: 13 }}>{item.description}</p>}

                    <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>In Stock</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: item.lowStock ? '#ef4444' : 'inherit' }}>{item.quantity}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Picked Up</div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{item.pickupCount}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                        <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }}
                          onClick={() => { setBrewRestockForm({ merchId: item.id, quantity: '', notes: '' }); setShowBrewRestockModal(true); }}>
                          + Restock
                        </button>
                      </div>
                    </div>

                    {item.stockUpdatedAt && (
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 8 }}>
                        Last updated: {new Date(item.stockUpdatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent restock history */}
          {brewRestocks.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-card-title">Recent Restocks</h3>
              <table className="admin-table">
                <thead>
                  <tr><th>Item</th><th>Qty Added</th><th>Notes</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {brewRestocks.map((r, i) => (
                    <tr key={i}>
                      <td>{brewMerch.find(m => m.id === r.merchandise_id)?.name || '—'}</td>
                      <td>+{r.quantity}</td>
                      <td>{r.notes || '—'}</td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Restock Modal */}
          {showBrewRestockModal && (
            <div className="admin-modal-overlay" onClick={() => setShowBrewRestockModal(false)}>
              <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h3 className="admin-card-title">Restock</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                  {brewMerch.find(m => m.id === brewRestockForm.merchId)?.name}
                </p>
                <div className="admin-form-group">
                  <label className="admin-label">Quantity to Add</label>
                  <input className="admin-input" type="number" min="1" value={brewRestockForm.quantity}
                    onChange={e => setBrewRestockForm({ ...brewRestockForm, quantity: e.target.value })} autoFocus />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Notes (optional)</label>
                  <input className="admin-input" value={brewRestockForm.notes}
                    onChange={e => setBrewRestockForm({ ...brewRestockForm, notes: e.target.value })} placeholder="e.g. Received 20 hats" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={handleBrewRestockSubmit}
                    disabled={brewRestocking || !brewRestockForm.quantity || Number(brewRestockForm.quantity) <= 0}>
                    {brewRestocking ? 'Restocking...' : 'Confirm Restock'}
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => setShowBrewRestockModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'audience' && (
        <>
          {audienceLoading && <p style={{ color: 'var(--admin-text-muted)', padding: 20 }}>Loading audience insights...</p>}
          {audience && (
            <>
              {/* KPI Cards */}
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>Your Visitors</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-accent)' }}>{audience.demographics?.totalParticipants || 0}</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>checked in here</div>
                </div>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>Completed Onboarding</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-accent)' }}>{audience.demographics?.onboardedCount || 0}</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{audience.demographics?.onboardingRate || 0}% of visitors</div>
                </div>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>Local vs Visitor</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-accent)' }}>{audience.demographics?.localVsVisitor?.localPercent || 0}%</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                    {audience.demographics?.localVsVisitor?.locals || 0} locals · {audience.demographics?.localVsVisitor?.visitors || 0} visitors
                  </div>
                </div>
              </div>

              {/* Top Vibes */}
              {audience.demographics?.byVibe && Object.keys(audience.demographics.byVibe).length > 0 && (
                <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Your Crowd</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(audience.demographics.byVibe)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([vibe, count]) => {
                        const total = Object.values(audience.demographics.byVibe).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const label = vibe.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={vibe}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <span>{label}</span>
                              <span style={{ color: 'var(--admin-text-muted)' }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8 }}>
                              <div style={{ background: 'var(--admin-accent)', borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Beer Style Preferences */}
              {audience.beerPreferences?.byBreweryVisitors && (() => {
                const prefs = Object.values(audience.beerPreferences.byBreweryVisitors)[0] || {};
                const entries = Object.entries(prefs).sort((a, b) => b[1] - a[1]).slice(0, 5);
                if (entries.length === 0) return null;
                const total = entries.reduce((sum, [, c]) => sum + c, 0);
                return (
                  <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>What Your Visitors Like to Drink</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {entries.map(([style, count]) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const label = style.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={style}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <span>{label}</span>
                              <span style={{ color: 'var(--admin-text-muted)' }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8 }}>
                              <div style={{ background: '#66bb6a', borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Peak Days */}
              {audience.timing?.byDayOfWeek && (
                <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Busiest Days</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
                    {audience.timing.byDayOfWeek.map((d) => {
                      const max = Math.max(...audience.timing.byDayOfWeek.map(x => x.count), 1);
                      const h = Math.max(d.count / max * 80, 4);
                      const isPeak = d.day === audience.timing.peakDay;
                      return (
                        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{d.count}</span>
                          <div style={{
                            width: '100%', height: h, borderRadius: 4,
                            background: isPeak ? 'var(--admin-accent)' : 'rgba(255,255,255,0.15)',
                          }} />
                          <span style={{ fontSize: 10, color: isPeak ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }}>
                            {d.day.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gender Split (if data) */}
              {audience.demographics?.byGender && Object.keys(audience.demographics.byGender).length > 0 && (
                <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Gender Split</h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {Object.entries(audience.demographics.byGender)
                      .sort((a, b) => b[1] - a[1])
                      .map(([gender, count]) => {
                        const total = Object.values(audience.demographics.byGender).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const label = gender.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={gender} style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{pct}%</div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{label}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Upsell banner */}
              <div style={{
                border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 24,
                textAlign: 'center', color: 'var(--admin-text-muted)', marginTop: 8
              }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Want deeper insights?</div>
                <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                  Unlock full analytics: hourly heatmaps, engagement by segment, brewery comparisons, nudge candidates, and quarterly reports.
                </div>
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--admin-accent)' }}>Coming soon — contact trail admin for early access</div>
              </div>

              {/* Refresh button */}
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button className="admin-btn admin-btn-secondary" style={{ width: 'auto', fontSize: 12 }}
                  onClick={() => {
                    setAudienceLoading(true);
                    setAudience(null);
                    getTrailAnalytics(TRAIL_ID, 'brewery', brewery.id).then(res => {
                      if (res.ok) setAudience(res);
                      setAudienceLoading(false);
                    });
                  }}>
                  Refresh Data
                </button>
              </div>
            </>
          )}
          {!audienceLoading && !audience && (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--admin-text-muted)' }}>No audience data available yet. Check-ins will populate this tab.</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}