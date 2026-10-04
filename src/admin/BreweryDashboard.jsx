import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweryEvents, createBreweryEvent, deleteEvent, updateEvent, updateBreweryPin, updateBreweryHours, updateBrewery, getTrailBreweries, getBreweryBeers, createBreweryBeer, updateBreweryBeer, deleteBreweryBeer, bulkUploadBeers, mergeRatings, updateAdminAccount, getBreweryMerchandise, restockMerchandise, getTrailAnalytics, getBreweryStaff, inviteBreweryStaff, updateBreweryStaffRole, removeBreweryStaff, pingVenueVisit, fixLink, driveToImage, uploadVenuePhoto, uploadVenueLogo, TRAIL_ID } from './adminApi';
import { logoFor } from '../v2/util';
import { useToast, useConfirm } from './AdminFeedback';
import LocationsCard from './LocationsCard';
import VenueDemoCard from './VenueDemoCard';
import VenueChecklist from './VenueChecklist';
import { useT } from './i18n';

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
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();
  const [selectedBreweryId, setSelectedBreweryId] = useState(propBreweryId || '');
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  // Remember the open tab for this browser tab, so a refresh (e.g. the new-version pop-up) reopens it.
  const [activeTab, setActiveTab] = useState(() => { try { return sessionStorage.getItem('hcm-venue-tab') || 'overview'; } catch { return 'overview'; } });
  useEffect(() => { try { sessionStorage.setItem('hcm-venue-tab', activeTab); } catch {} }, [activeTab]);

  // Audience analytics (free tier)
  const [audience, setAudience] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const [pinCode, setPinCode] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');


  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [operatingHours, setOperatingHours] = useState(DEFAULT_HOURS);
  const [hasHours, setHasHours] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  const [socialLinks, setSocialLinks] = useState({ mapsUrl: '', instagramUrl: '', facebookUrl: '' });
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoBroken, setPhotoBroken] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueDistrict, setVenueDistrict] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoLink, setShowPhotoLink] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState('');
  // Owners, managers, brewery admins and HQ manage the venue; plain staff don't
  // (the API enforces this; hiding the controls just avoids dead ends).
  const canManage = staffRole !== 'staff';
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
  const [staffError, setStaffError] = useState('');
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

  // Let HQ see the venue actually uses its dashboard: one visit on open, then again
  // when they come back to the tab after 30 minutes or more. HQ's own views aren't counted.
  useEffect(() => {
    if (!breweryId || isHQ) return undefined;
    let last = 0;
    const ping = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 30 * 60 * 1000) return;
      last = Date.now();
      pingVenueVisit(breweryId);
    };
    ping();
    document.addEventListener('visibilitychange', ping);
    return () => document.removeEventListener('visibilitychange', ping);
  }, [breweryId, isHQ]);

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
      setSavedPin(dashResult.brewery?.pinCode || dashResult.brewery?.pin_code || '');
      const hours = dashResult.brewery?.operatingHours || dashResult.brewery?.operating_hours;
      if (hours) {
        setOperatingHours({ ...DEFAULT_HOURS, ...hours });
      }
      setHasHours(!!hours && typeof hours === 'object' && Object.keys(hours).length > 0);
      setPhotoUrl(dashResult.brewery?.photoUrl || dashResult.brewery?.photo_url || '');
      setLogoUrl(dashResult.brewery?.logoUrl || dashResult.brewery?.logo_url || '');
      setVenueName(dashResult.brewery?.name || '');
      setVenueAddress(dashResult.brewery?.address || '');
      setVenueDistrict(dashResult.brewery?.district || '');
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
      setSavedPin(pinCode);
      setPinMessage('✓ PIN updated successfully');
      setTimeout(() => setPinMessage(''), 3000);
    } else {
      setPinMessage(result.error || 'Failed to update PIN');
    }
    setSavingPin(false);
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
      setPasswordMessage(t('New passwords do not match'));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage(t('Password must be at least 8 characters'));
      return;
    }
    setSavingPassword(true);
    setPasswordMessage('');
    const result = await updateAdminAccount({ currentPassword, password: newPassword });
    if (result.ok) {
      setPasswordMessage('✓ ' + t('Password updated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 5000);
    } else {
      setPasswordMessage(t(result.error || 'Failed to update password'));
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
    const fixed = { mapsUrl: fixLink(socialLinks.mapsUrl || ''), instagramUrl: fixLink(socialLinks.instagramUrl || ''), facebookUrl: fixLink(socialLinks.facebookUrl || '') };
    setSocialLinks(fixed);
    const result = await updateBrewery(breweryId, {
      maps_url: fixed.mapsUrl || null,
      instagram_url: fixed.instagramUrl || null,
      facebook_url: fixed.facebookUrl || null,
    });
    if (result.ok) {
      setSocialMessage('✓ Social links updated');
      setTimeout(() => setSocialMessage(''), 3000);
    } else {
      setSocialMessage(result.error || 'Failed to update');
    }
    setSavingSocial(false);
  };

  const handleSavePhoto = async () => {
    const value = driveToImage(fixLink(photoUrl.trim()));
    setPhotoUrl(value);
    setSavingPhoto(true);
    setPhotoMessage('');
    const result = await updateBrewery(breweryId, { photo_url: value || null });
    if (result.ok) {
      setPhotoMessage(value ? '✓ Photo updated' : '✓ Photo removed');
      setTimeout(() => setPhotoMessage(''), 3000);
    } else {
      setPhotoMessage(result.error || 'Failed to update');
    }
    setSavingPhoto(false);
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true); setAddressMessage('');
    const name = venueName.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (name.length < 2) { setSavingAddress(false); setAddressMessage(t('Venue name is too short')); return; }
    const result = await updateBrewery(breweryId, { name, address: venueAddress.trim(), district: venueDistrict.trim() });
    setSavingAddress(false);
    if (result.ok) {
      setVenueName(name);
      setData((d) => (d ? { ...d, brewery: { ...d.brewery, name } } : d));
      setAddressMessage('✓ ' + t('Saved')); setTimeout(() => setAddressMessage(''), 3000);
    }
    else setAddressMessage(t(result.error || 'Failed to update'));
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
      setHasHours(true);
      setTimeout(() => setHoursMessage(''), 3000);
    } else {
      setHoursMessage(result.error || 'Failed to update hours');
    }
    setSavingHours(false);
  };

  const handleToggleVenueStatus = async () => {
    const newStatus = venueStatus === 'temporarily_closed' ? 'active' : 'temporarily_closed';
    const ok = await confirm(newStatus === 'temporarily_closed'
      ? { title: t('Mark as temporarily closed?'), message: t('Guests will see a closure notice in the app and your venue shows as closed until you mark it active again.'), confirmLabel: t('Mark closed'), danger: true }
      : { title: t('Mark as open again?'), message: t('Guests will see your normal opening hours again.'), confirmLabel: t('Mark open') });
    if (!ok) return;
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
    const ok = await confirm({
      title: t('Delete event?'),
      message: t('This event will be permanently removed.'),
      confirmLabel: t('Delete'),
      danger: true,
    });
    if (!ok) return;
    const result = await deleteEvent(eventId);
    if (result.ok) {
      setEvents(events.filter(e => e.id !== eventId));
      toast.success(t('Event deleted'));
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      toast.error(t('Title (English) and Start Date/Time are required'));
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
      toast.success(t('Event created'));
    } else {
      toast.error(result.error || 'Failed to create event');
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
      toast.error(t('Title (English) and Start Date/Time are required'));
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
      toast.success(t('Event updated'));
    } else {
      toast.error(result.error || 'Failed to update event');
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

  // Load stock as soon as the dashboard opens so a low-stock warning shows on the Stock tab straight away.
  useEffect(() => {
    if (breweryId) loadMerch();
  }, [breweryId]);
  useEffect(() => {
    if (activeTab === 'stock' && breweryId) loadMerch();
  }, [activeTab]);

  const loadStaff = async () => {
    if (!breweryId) return;
    setStaffLoading(true);
    setStaffError('');
    const result = await getBreweryStaff(breweryId);
    if (result.ok) {
      setStaff(result.staff || []);
    } else {
      setStaffError(result.error || 'Failed to load team members');
    }
    setStaffLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'team' && breweryId) loadStaff();
  }, [activeTab, breweryId]);
  // Owners and managers: load the team on open so the checklist knows if bar staff are added.
  useEffect(() => {
    if (breweryId && canManage) loadStaff();
  }, [breweryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInviteStaff = async () => {
    setInviteError('');
    if (!inviteEmail.trim()) { setInviteError('Email is required'); return; }
    setInviting(true);
    const result = await inviteBreweryStaff(breweryId, inviteEmail.trim(), inviteRole);
    if (result.ok) {
      setShowInviteModal(false);
      setInviteResult({ email: inviteEmail.trim(), tempPassword: result.tempPassword || null, isNew: !!result.tempPassword });
      setInviteEmail('');
      setInviteRole('staff');
      await loadStaff();
    } else {
      setInviteError(result.error || 'Failed to add member');
    }
    setInviting(false);
  };

  const handleUpdateStaffRole = async (staffId, newRole) => {
    const member = staff.find((m) => m.id === staffId);
    const ok = await confirm({
      title: t('Change this person\'s role?'),
      message: `${member?.email || 'This person'} will become ${newRole === 'owner' ? 'an owner' : `a ${newRole}`}. ${newRole === 'staff' ? 'Staff can check guests in and see stock, but can\'t edit the venue or see the code settings.' : 'Managers and owners can edit beers, events, hours and stock.'}`,
      confirmLabel: t('Change role'),
    });
    if (!ok) return;
    const result = await updateBreweryStaffRole(breweryId, staffId, newRole);
    if (result.ok) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, role: newRole } : s));
      toast.success(t('Role updated'));
    } else {
      toast.error(result.error || 'Failed to update role');
    }
  };

  const handleRemoveStaff = async (staffId, email) => {
    const ok = await confirm({
      title: t('Remove team member?'),
      message: `${email} will lose access to this brewery dashboard.`,
      confirmLabel: t('Remove'),
      danger: true,
    });
    if (!ok) return;
    const result = await removeBreweryStaff(breweryId, staffId);
    if (result.ok) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      toast.success(t('Team member removed'));
    } else {
      toast.error(result.error || 'Failed to remove');
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
      toast.success(t('Restock recorded'));
    } else {
      toast.error(result.error || 'Failed to restock');
    }
    setBrewRestocking(false);
  };

  const handleCreateBeer = async () => {
    if (!beerForm.name.trim()) {
      toast.error(t('Beer name is required'));
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
      toast.success(t('Beer added'));
    } else {
      toast.error(result.error || 'Failed to create beer');
    }
    setSavingBeer(false);
  };

  const handleUpdateBeer = async () => {
    if (!beerForm.name.trim()) {
      toast.error(t('Beer name is required'));
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
      toast.success(t('Beer updated'));
    } else {
      toast.error(result.error || 'Failed to update beer');
    }
    setSavingBeer(false);
  };

  const handleDeleteBeer = async (beer) => {
    const ok = await confirm({
      title: t('Remove beer?'),
      message: `"${beer.name}" will be removed from the menu.`,
      confirmLabel: t('Remove'),
      danger: true,
    });
    if (!ok) return;
    const result = await deleteBreweryBeer(breweryId, beer.id);
    if (result.ok) {
      setBeers(prev => prev.filter(b => b.id !== beer.id));
      toast.success(t('Beer removed'));
    } else {
      toast.error(result.error || 'Failed to remove beer');
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
      toast.success(`Successfully added ${result.count} beer${result.count !== 1 ? 's' : ''}`);
    } else {
      toast.error(result.error || 'Bulk upload failed');
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
      toast.success(t('Ratings merged'));
    } else {
      toast.error(result.error || 'Merge failed');
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
            <label className="admin-form-label">{t('Select Brewery')}</label>
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
          <label className="admin-form-label">{t('Select Brewery')}</label>
          <select className="admin-form-input" style={{ maxWidth: 300 }} value={selectedBreweryId} onChange={(e) => setSelectedBreweryId(e.target.value)}>
            {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <h1 className="admin-page-title">{brewery.name || t('Brewery')} · {t('Dashboard')}</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>{t('Overview')}</button>
        <button className={`admin-tab ${activeTab === 'ratings' ? 'active' : ''}`} onClick={() => setActiveTab('ratings')}>{t('Beer Ratings')}</button>
        <button className={`admin-tab ${activeTab === 'competition' ? 'active' : ''}`} onClick={() => setActiveTab('competition')}>{t('Trail Competition')}</button>
        {canManage && <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>{t('Events')} ({events.length})</button>}
        {canManage && <button className={`admin-tab ${activeTab === 'beers' ? 'active' : ''}`} onClick={() => setActiveTab('beers')}>{t('Beer Menu')}</button>}
        <button className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>{brewMerch.some(m => m.lowStock) ? t('Stock · low') : t('Stock')}</button>
        <button className={`admin-tab ${activeTab === 'audience' ? 'active' : ''}`} onClick={() => {
          setActiveTab('audience');
          if (!audience && !audienceLoading) {
            setAudienceLoading(true);
            getTrailAnalytics(TRAIL_ID, 'brewery', brewery.id).then(res => {
              if (res.ok) setAudience(res);
              setAudienceLoading(false);
            });
          }
        }}>{t('Audience')}</button>
        {(staffRole === 'owner' || staffRole === 'manager') && (
          <button className={`admin-tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>{t('Team')}</button>
        )}
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>{t('Settings')}</button>
      </div>

      {canManage && activeTab === 'overview' && (
        <VenueChecklist breweryId={breweryId} isHQ={isHQ} photoUrl={photoUrl} hasHours={hasHours} socialLinks={socialLinks}
          descriptionEn={descriptionEn} descriptionVn={descriptionVn} savedPin={savedPin} beers={beers} merch={brewMerch} events={events} staff={staff}
          onGo={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0 }); }}
          onDemoRemoved={() => { loadBeers(); getBreweryEvents(breweryId).then((r) => r?.ok && setEvents(r.events || [])); }} />
      )}
      {/* On Overview the checklist handles demo removal; the box shows on the other tabs. */}
      {canManage && activeTab !== 'overview' && <VenueDemoCard breweryId={breweryId} refreshKey={activeTab} onRemoved={() => { loadBeers(); getBreweryEvents(breweryId).then((r) => r?.ok && setEvents(r.events || [])); }} />}

      {activeTab === 'overview' && (
        <>

          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>{t('Last 24h')}</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>{t('Last 7 days')}</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>{t('Last 30 days')}</button>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Total Check-ins')}</div><div className="admin-kpi-value primary">{totals.checkins || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Trail Rank')}</div><div className="admin-kpi-value primary">{ranking.rank || '--'}<span style={{ fontSize: 14, color: 'var(--admin-text-muted)' }}> / {ranking.total || '--'}</span></div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Avg Beer Rating')}</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div><div className="admin-kpi-subtext">{t('{n} ratings', { n: ratings.countVenue || 0 })}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Hat Claims Here')}</div><div className="admin-kpi-value success">{journeyStats.hatClaimsHere || 0}</div></div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card"><h3 className="admin-card-title">{t('Started Here')}</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.startedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>{t('participants began their trail here')}</div></div>
            <div className="admin-card"><h3 className="admin-card-title">{t('Ended Here')}</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.endedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>{t('participants finished their trail here')}</div></div>
            <div className="admin-card"><h3 className="admin-card-title">{t('Hat Claims')}</h3><div className="admin-kpi-value success" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.hatClaimsHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>{t('hats claimed at this location')}</div></div>
          </div>

          {beerRatings.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-card-title">{t('Top Rated Beers')}</h3>
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('Beer')}</th><th>{t('Avg Rating')}</th><th>{t('# Ratings')}</th></tr></thead><tbody>
                {beerRatings.slice(0, 5).map((beer, i) => (
                  <tr key={i}><td><strong>{beer.beerName}</strong></td><td>{beer.avgRating.toFixed(2)}★</td><td>{beer.count}</td></tr>
                ))}
              </tbody></table></div>
            </div>
          )}
        </>
      )}

      {activeTab === 'ratings' && (
        <>
          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">{t('Rating Summary')}</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Overall Avg')}</div><div className="admin-kpi-value primary">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Total Ratings')}</div><div className="admin-kpi-value">{ratings.countVenue || 0}</div></div>
              </div>
              {beerRatings.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{t('Highest Rated')}</span>
                    <span><strong>{beerRatings[0].beerName}</strong> ({beerRatings[0].avgRating.toFixed(2)}★)</span>
                  </div>
                  {beerRatings.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--admin-text-muted)' }}>{t('Lowest Rated')}</span>
                      <span><strong>{beerRatings[beerRatings.length - 1].beerName}</strong> ({beerRatings[beerRatings.length - 1].avgRating.toFixed(2)}★)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">{t('Trail Comparison')}</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Your Avg')}</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">{t('Trail Avg')}</div><div className="admin-kpi-value">{ratings.avgRatingTrail?.toFixed(1) || '--'}★</div></div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">{t('All Beer Ratings')}</h3>
            {beerRatings.length === 0 ? (<div className="admin-empty">{t('No beer ratings yet')}</div>) : (
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('Beer')}</th><th>{t('Avg Rating')}</th><th>{t('# Ratings')}</th></tr></thead><tbody>
                {beerRatings.map((beer, i) => (
                  <tr key={i}>
                    <td><strong>{beer.beerName}</strong></td>
                    <td><span style={{ color: beer.avgRating >= 4 ? 'var(--admin-success)' : beer.avgRating >= 3 ? 'var(--admin-warning)' : 'var(--admin-danger)' }}>{beer.avgRating.toFixed(2)}★</span></td>
                    <td>{beer.count}</td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">{t('Recent Reviews')}</h3>
            {(ratings.latest || []).length === 0 ? (<div className="admin-empty">{t('No reviews yet')}</div>) : (
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
            // Merging rating names edits the venue's beer data: owners/managers/admins only
            if (!canManage || activeMenuNames.size === 0 || unmatched.length === 0) return null;
            const menuOptions = beers.filter(b => b.active !== false);
            return (
              <div className="admin-card">
                <h3 className="admin-card-title">{t('Merge Ratings')}</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  {t('These submitted beer names don\'t match your menu. Reassign them to the correct menu entry to keep ratings clean.')}
                </p>
                <div className="admin-table-wrap"><table className="admin-table">
                  <thead><tr><th>{t('Submitted Name')}</th><th>{t('# Ratings')}</th><th>{t('Reassign to')}</th><th></th></tr></thead>
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
                            <option value="">{t('— keep as-is —')}</option>
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
                </table></div>
              </div>
            );
          })()}
        </>
      )}

      {activeTab === 'competition' && (
        <div className="admin-card">
          <h3 className="admin-card-title">{t('Trail Competition')}</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>{t('See how you rank against other breweries on the trail.')}</p>
          {checkinsByBrewery.length === 0 ? (<div className="admin-empty">{t('No data yet')}</div>) : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('Rank')}</th><th>{t('Brewery')}</th><th>{t('Check-ins')}</th></tr></thead><tbody>
              {checkinsByBrewery.sort((a, b) => b.count - a.count).map((b, index) => {
                const isYou = b.breweryId === breweryId;
                return (
                  <tr key={b.breweryId} style={isYou ? { background: 'var(--hq-panel2)' } : {}}>
                    <td>
                      <span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td><strong>{b.breweryName}</strong>{isYou && <span style={{ marginLeft: 8, color: 'var(--admin-primary)', fontSize: 12 }}>{t('(You)')}</span>}</td>
                    <td><strong>{b.count}</strong></td>
                  </tr>
                );
              })}
            </tbody></table></div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <div className="admin-form-group"><label className="admin-form-label">{t('Title (English) *')}</label><input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('Title (Vietnamese)')}</label><input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('Description')}</label><textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('Start Date/Time *')}</label><input type="datetime-local" className="admin-form-input" value={eventForm.startsAt} onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('End Date/Time')}</label><input type="datetime-local" className="admin-form-input" value={eventForm.endsAt} onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('Link')}</label><input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">{t('Category')}</label><select className="admin-form-input" value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})}><option value="event">{t('Event')}</option><option value="new_release">{t('New Release')}</option></select></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button className="admin-btn admin-btn-primary" onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} disabled={savingEvent}>{savingEvent ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}</button><button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>{t('Cancel')}</button></div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>{t('Events')}</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={openCreateEvent}>{t('+ Create Event')}</button></div>
            {events.length === 0 ? (<div className="admin-empty">{t('No events yet')}</div>) : (
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('Event')}</th><th>{t('Category')}</th><th>{t('Date')}</th><th>{t('Status')}</th><th>{t('Actions')}</th></tr></thead><tbody>
                {events.map((event) => (
                  <tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td><span className={`admin-badge ${event.category === 'new_release' ? 'success' : 'active'}`}>{event.category === 'new_release' ? 'Release' : t('Event')}</span></td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td><td><div style={{ display: 'flex', gap: 6 }}><button className="admin-btn-small" style={{ background: 'var(--admin-primary)', color: '#fff' }} onClick={() => openEditEvent(event)}>{t('Edit')}</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>{t('Delete')}</button></div></td></tr>
                ))}
              </tbody></table></div>
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
                  <label className="admin-form-label">{t('Beer Name *')}</label>
                  <input type="text" className="admin-form-input" value={beerForm.name} onChange={(e) => setBeerForm({ ...beerForm, name: e.target.value })} placeholder={t('e.g. Saigon IPA')} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">{t('Style')}</label>
                  <input type="text" className="admin-form-input" value={beerForm.style} onChange={(e) => setBeerForm({ ...beerForm, style: e.target.value })} placeholder={t('e.g. IPA, Stout, Lager')} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">{t('ABV (%)')}</label>
                  <input type="number" className="admin-form-input" style={{ maxWidth: 120 }} value={beerForm.abv} onChange={(e) => setBeerForm({ ...beerForm, abv: e.target.value })} placeholder={t('e.g. 5.5')} step="0.1" min="0" max="100" />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={editingBeer ? handleUpdateBeer : handleCreateBeer} disabled={savingBeer}>
                    {savingBeer ? 'Saving...' : editingBeer ? 'Save Changes' : 'Add Beer'}
                  </button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={closeBeerForm}>{t('Cancel')}</button>
                </div>
              </div>
            </div>
          )}
          {showBulkUpload && (
            <div className="admin-modal-overlay" onClick={() => setShowBulkUpload(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <h3 style={{ marginBottom: 8 }}>{t('Bulk Import Beers')}</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  {t('Add multiple beers at once. Upload a CSV file or paste data from a spreadsheet. Format:')} <strong>{t('Name, Style, ABV')}</strong> {t('(one beer per line). Style and ABV are optional.')}
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <label className="admin-btn admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)', cursor: 'pointer', margin: 0 }}>
                    {t('Choose CSV file')}
                    <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvFile} style={{ display: 'none' }} />
                  </label>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, alignSelf: 'center' }}>{t('or paste below')}</span>
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
                      <div className="admin-table-wrap"><table className="admin-table" style={{ margin: 0 }}>
                        <thead><tr><th>{t('Name')}</th><th>{t('Style')}</th><th>{t('ABV')}</th></tr></thead>
                        <tbody>
                          {bulkParsed.map((b, i) => (
                            <tr key={i}><td>{b.name}</td><td style={{ color: 'var(--admin-text-muted)' }}>{b.style || '—'}</td><td style={{ color: 'var(--admin-text-muted)' }}>{b.abv || '—'}</td></tr>
                          ))}
                        </tbody>
                      </table></div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={handleBulkSubmit} disabled={bulkUploading || bulkParsed.length === 0}>
                    {bulkUploading ? 'Uploading...' : `Import ${bulkParsed.length} Beer${bulkParsed.length !== 1 ? 's' : ''}`}
                  </button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowBulkUpload(false)}>{t('Cancel')}</button>
                </div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0 }}>{t('Beer Menu')}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowBulkUpload(true)}>{t('↑ Bulk Import')}</button>
                <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => setShowBeerForm(true)}>{t('+ Add Beer')}</button>
              </div>
            </div>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              {t("These beers appear as options in the app's beer rating dropdown. Customers can still type a custom name if theirs isn't listed.")}
            </p>
            {beersLoading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : beers.filter(b => b.active !== false).length === 0 ? (
              <div className="admin-empty">{t('No beers on the menu yet. Add your first beer!')}</div>
            ) : (
              <div className="admin-table-wrap"><table className="admin-table">
                <thead><tr><th>{t('Beer')}</th><th>{t('Style')}</th><th>{t('ABV')}</th><th>{t('Actions')}</th></tr></thead>
                <tbody>
                  {beers.filter(b => b.active !== false).map((beer) => (
                    <tr key={beer.id}>
                      <td><strong>{beer.name}</strong></td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{beer.style || '—'}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{beer.abv != null ? `${beer.abv}%` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => openEditBeer(beer)}>{t('Edit')}</button>
                          <button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteBeer(beer)}>{t('Remove')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </>
      )}

      {activeTab === 'team' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>{t('Team Members')}</h2>
            {staffRole === 'owner' && (
              <button
                className="admin-btn admin-btn-primary settings-btn"
                onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteEmail(''); setInviteRole('staff'); setInviteResult(null); }}
              >
                {t('+ Add Member')}
              </button>
            )}
          </div>

          {inviteResult && (
            <div style={{
              background: 'var(--hq-panel2)',
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
                ✓ {inviteResult.isNew ? `Account created for ${inviteResult.email}` : `${inviteResult.email} added to team`}
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
                    {t('Share this with them to log in. They should change their password after first login.')}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  {t('They already have an account and have been added to the team.')}
                </div>
              )}
            </div>
          )}

          {staffError && (
            <div className="admin-error" style={{ marginBottom: 12 }}>
              Error loading team: {staffError}
              <button className="admin-btn" style={{ marginLeft: 12, width: 'auto', padding: '4px 12px', fontSize: 13 }} onClick={loadStaff}>{t('Retry')}</button>
            </div>
          )}

          {staffLoading ? (
            <div className="admin-loading"><div className="admin-spinner" /></div>
          ) : (
            <div className="admin-card">
              <div className="admin-table-wrap"><table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('Email')}</th>
                    <th>{t('Role')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Since')}</th>
                    {staffRole === 'owner' && <th style={{ width: 90 }}>{t('Actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={staffRole === 'owner' ? 5 : 4} style={{ color: 'var(--admin-text-muted)', padding: '16px 12px', fontSize: 14 }}>
                        {t('No team members yet.')}
                      </td>
                    </tr>
                  )}
                  {staff.map(member => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>
                        {member.email}
                        {member.email === adminEmail && (
                          <span className="admin-pill" style={{ marginLeft: 8, verticalAlign: 'middle' }}>{t('you')}</span>
                        )}
                      </td>
                      <td>
                        {staffRole === 'owner' && member.email !== adminEmail ? (
                          <select
                            className="admin-select"
                            value={member.role}
                            onChange={e => handleUpdateStaffRole(member.id, e.target.value)}
                          >
                            <option value="owner">{t('Owner')}</option>
                            <option value="manager">{t('Manager')}</option>
                            <option value="staff">{t('Staff')}</option>
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
                              {t('Remove')}
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}

          {showInviteModal && (
            <div className="admin-modal-backdrop" onMouseDown={() => setShowInviteModal(false)}>
              <div className="admin-modal" onMouseDown={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <div className="admin-modal-title">{t('Add Team Member')}</div>
                  <button className="admin-btn-ghost" onClick={() => setShowInviteModal(false)}>✕</button>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('Email address')}</label>
                  <input
                    className="admin-form-input"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder={t('staff@example.com')}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleInviteStaff()}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('Role')}</label>
                  <select
                    className="admin-form-input"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="staff">{t('Staff — view-only access')}</option>
                    <option value="manager">{t('Manager — edit settings, events, beer menu')}</option>
                    <option value="owner">{t('Owner — full access including team management')}</option>
                  </select>
                </div>

                {inviteError && <div className="admin-error">{inviteError}</div>}

                <div className="admin-form-actions">
                  <button className="admin-btn settings-btn" onClick={() => setShowInviteModal(false)} disabled={inviting}>
                    {t('Cancel')}
                  </button>
                  <button className="admin-btn admin-btn-primary settings-btn" onClick={handleInviteStaff} disabled={inviting}>
                    {inviting ? 'Adding…' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="admin-settings-grid">
          {/* Left column: Venue Status, Social Links, Operating Hours (managers only) */}
          {canManage ? (<div>
          <div className="admin-card" style={{ borderLeft: venueStatus === 'temporarily_closed' ? '4px solid var(--admin-danger)' : '4px solid var(--admin-success)' }}>
            <h3 className="admin-card-title">{t('Venue Status')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>
              {venueStatus === 'temporarily_closed'
                ? 'This venue is currently marked as temporarily closed. Visitors will see a closure notice in the app.'
                : t('This venue is active and accepting check-ins.')}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className={`admin-btn ${venueStatus === 'temporarily_closed' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                onClick={handleToggleVenueStatus}
                disabled={savingVenueStatus}
              >
                {savingVenueStatus ? 'Saving...' : venueStatus === 'temporarily_closed' ? 'Mark as Active' : t('Mark as Temporarily Closed')}
              </button>
              {venueStatusMessage && <span style={{ fontSize: 13, color: venueStatusMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{venueStatusMessage}</span>}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">{t('Social Links')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('These appear as buttons on your venue page in the app.')}</p>
            <div className="admin-form-group">
              <label className="admin-form-label">{t('Google Maps URL')}</label>
              <input type="url" className="admin-form-input" value={socialLinks.mapsUrl} onChange={(e) => setSocialLinks(prev => ({ ...prev, mapsUrl: e.target.value }))} placeholder="https://maps.google.com/..." />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">{t('Instagram URL')}</label>
              <input type="url" className="admin-form-input" value={socialLinks.instagramUrl} onChange={(e) => setSocialLinks(prev => ({ ...prev, instagramUrl: e.target.value }))} placeholder="https://instagram.com/yourvenue" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">{t('Facebook URL')}</label>
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
            <h3 className="admin-card-title">{t('Operating Hours')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('Set your weekly operating hours.')}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {DAY_NAMES.map((day, index) => (
                  <tr key={day} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '8px 12px 8px 0', width: 100, fontWeight: 500, fontSize: 14 }}>{DAY_LABELS[index]}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>
                      {operatingHours[day]?.closed ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>{t('Closed')}</span>
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
          </div>) : <div />}{/* end left column */}

          {/* Right column: Check-in PIN Code, Venue Description */}
          <div>
          {canManage && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Venue logo')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('Shown on the map, your venue page and stamps. A square logo works best.')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#fff', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {logoFor({ name: brewery?.name, logo_url: logoUrl })
                  ? <img src={logoFor({ name: brewery?.name, logo_url: logoUrl })} alt="" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                  : <span style={{ color: '#888', fontSize: 12 }}>{t('No logo')}</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="admin-btn admin-btn-primary settings-btn" style={{ width: 'auto', cursor: uploadingLogo ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  {uploadingLogo ? t('Uploading…') : t('Upload logo')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingLogo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setUploadingLogo(true); setLogoMessage('');
                      const r = await uploadVenueLogo(breweryId, file);
                      setUploadingLogo(false);
                      if (r?.ok) { setLogoUrl(r.logoUrl); setLogoMessage('✓ ' + t('Logo updated')); setTimeout(() => setLogoMessage(''), 4000); }
                      else setLogoMessage(t(r?.error || 'Upload failed. Please try again.'));
                    }} />
                </label>
                {logoMessage && <span style={{ fontSize: 13, color: logoMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{logoMessage}</span>}
              </div>
            </div>
          </div>
          )}
          {canManage && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Venue Photo')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('The big picture at the top of your venue page. Upload one from your phone or computer.')}</p>
            {photoUrl.trim().startsWith('https://') && (
              photoBroken
                ? <div style={{ padding: 14, marginBottom: 10, borderRadius: 8, border: '1px solid var(--admin-danger)', fontSize: 14 }}>{t("This link can't be shown as a photo. Use Upload photo instead.")}</div>
                : <img src={photoUrl.trim()} alt="" onError={() => setPhotoBroken(true)} onLoad={() => setPhotoBroken(false)} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="admin-btn admin-btn-primary settings-btn" style={{ width: 'auto', cursor: uploadingPhoto ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                {uploadingPhoto ? t('Uploading…') : t('Upload photo')}
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingPhoto}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadingPhoto(true); setPhotoMessage('');
                    const r = await uploadVenuePhoto(breweryId, file);
                    setUploadingPhoto(false);
                    if (r?.ok) { setPhotoUrl(r.photoUrl); setPhotoBroken(false); setPhotoMessage('✓ ' + t('Photo updated')); setTimeout(() => setPhotoMessage(''), 4000); }
                    else setPhotoMessage(t(r?.error || 'Upload failed. Please try again.'));
                  }} />
              </label>
              <button type="button" className="admin-btn" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowPhotoLink((x) => !x)}>{t('or paste a link')}</button>
              {photoMessage && <span style={{ fontSize: 13, color: photoMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{photoMessage}</span>}
            </div>
            {showPhotoLink && (
              <div style={{ marginTop: 12 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="venue-photo-url">{t('Photo URL')}</label>
                  <input id="venue-photo-url" type="text" inputMode="url" className="admin-form-input" value={photoUrl} onChange={(e) => { setPhotoUrl(e.target.value); setPhotoBroken(false); }} placeholder="https://..." />
                </div>
                <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSavePhoto} disabled={savingPhoto}>
                  {savingPhoto ? t('Saving…') : t('Save link')}
                </button>
              </div>
            )}
          </div>
          )}
          {canManage && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Venue name & address')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('Shown on your venue page, the map and stamps. Use whatever name your guests know you by.')}</p>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="venue-name">{t('Venue name')}</label>
              <input id="venue-name" type="text" className="admin-form-input" maxLength={80} value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Bia Thủ Công Sài Gòn" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="venue-address">{t('Address')}</label>
              <input id="venue-address" type="text" className="admin-form-input" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="201B Nam Ky Khoi Nghia" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="venue-district">{t('District')}</label>
              <input id="venue-district" type="text" className="admin-form-input" value={venueDistrict} onChange={(e) => setVenueDistrict(e.target.value)} placeholder="District 3" />
            </div>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '0 0 12px' }}>{t('If you moved, also update your Google Maps link so Directions go to the right place.')}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSaveAddress} disabled={savingAddress}>{savingAddress ? t('Saving…') : t('Save')}</button>
              {addressMessage && <span style={{ fontSize: 13, color: addressMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{addressMessage}</span>}
            </div>
          </div>
          )}

          {canManage && <LocationsCard breweryId={breweryId} breweryName={brewery?.name} mainHours={operatingHours} />}

          {/* Venue codes: owners, managers, brewery admins and HQ only (plain staff can't see or change them) */}
          {staffRole !== 'staff' && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Check-in PIN Code')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('4-digit PIN staff enter on the guest\'s phone to confirm a check-in.')}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="admin-form-input"
                style={{ width: 90, textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', fontSize: 16 }}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength="4"
                placeholder={t('4 digits')}
              />
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSavePin} disabled={savingPin}>
                {savingPin ? 'Saving...' : 'Save PIN'}
              </button>
              {pinMessage && <span style={{ fontSize: 13, color: pinMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{pinMessage}</span>}
            </div>
            <p style={{ color: 'var(--admin-text-muted)', marginTop: 10, fontSize: 13 }}>{t('Use a code only your team knows. Don\'t reuse another venue\'s code.')}</p>
          </div>
          )}

          {canManage && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Venue Description')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>{t('Shown on your venue page in the app.')}</p>
            <div className="admin-form-group">
              <label className="admin-form-label">{t('English')}</label>
              <textarea className="admin-form-input" rows={3} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder={t('Describe this venue...')} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">{t('Vietnamese')}</label>
              <textarea className="admin-form-input" rows={3} value={descriptionVn} onChange={(e) => setDescriptionVn(e.target.value)} placeholder="Mô tả địa điểm..." />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <button className="admin-btn admin-btn-primary settings-btn" onClick={handleSaveDescription} disabled={savingDescription}>
                {savingDescription ? 'Saving...' : 'Save Description'}
              </button>
              {descriptionMessage && <span style={{ fontSize: 13, color: descriptionMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{descriptionMessage}</span>}
            </div>
          </div>
          )}

          {!isHQ && (
          <div className="admin-card">
            <h3 className="admin-card-title">{t('Account Settings')}</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>{t('Manage your /admin login credentials.')}</p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{t('Change Email')}</p>
              {adminEmail && <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>Current: {adminEmail}</p>}
              <div className="admin-form-group">
                <input type="email" className="admin-form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t('New email address')} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="admin-btn admin-btn-primary settings-btn" onClick={handleUpdateEmail} disabled={savingEmail}>
                  {savingEmail ? 'Saving...' : 'Update Email'}
                </button>
                {emailMessage && <span style={{ fontSize: 13, color: emailMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{emailMessage}</span>}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{t('Change Password')}</p>
              <div className="admin-form-group">
                <label className="admin-form-label">{t('Current Password')}</label>
                <input type="password" className="admin-form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('Current password')} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">{t('New Password')}</label>
                <input type="password" className="admin-form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('New password (min 8 chars)')} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">{t('Confirm New Password')}</label>
                <input type="password" className="admin-form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('Confirm new password')} />
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
            <h3 className="admin-card-title">{t('Merchandise Stock')}</h3>
            {merchLoading ? (
              <p style={{ color: 'var(--admin-text-muted)' }}>{t('Loading stock data...')}</p>
            ) : brewMerch.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)' }}>{t('No merchandise items configured for this trail yet. Ask HQ to add items.')}</p>
            ) : (
              <div>
                {brewMerch.map(item => (
                  <div key={item.id} className="admin-card" style={{ marginBottom: 12, background: 'var(--admin-bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{item.name}</h4>
                      {item.lowStock && <span className="admin-badge admin-badge-error">{t('LOW STOCK')}</span>}
                    </div>
                    {item.description && <p style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0', fontSize: 13 }}>{item.description}</p>}

                    <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>{t('In Stock')}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: item.lowStock ? 'var(--admin-danger)' : 'inherit' }}>{item.quantity}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>{t('Picked Up')}</div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{item.pickupCount}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                        {canManage && (<button className="admin-btn admin-btn-primary" style={{ width: 'auto' }}
                          onClick={() => { setBrewRestockForm({ merchId: item.id, quantity: '', notes: '' }); setShowBrewRestockModal(true); }}>
                          {t('+ Restock')}
                        </button>)}
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
              <h3 className="admin-card-title">{t('Recent Restocks')}</h3>
              <div className="admin-table-wrap"><table className="admin-table">
                <thead>
                  <tr><th>{t('Item')}</th><th>{t('Qty Added')}</th><th>{t('Notes')}</th><th>{t('Date')}</th></tr>
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
              </table></div>
            </div>
          )}

          {/* Restock Modal */}
          {showBrewRestockModal && (
            <div className="admin-modal-overlay" onClick={() => setShowBrewRestockModal(false)}>
              <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h3 className="admin-card-title">{t('Restock')}</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                  {brewMerch.find(m => m.id === brewRestockForm.merchId)?.name}
                </p>
                <div className="admin-form-group">
                  <label className="admin-label">{t('Quantity to Add')}</label>
                  <input className="admin-input" type="number" min="1" value={brewRestockForm.quantity}
                    onChange={e => setBrewRestockForm({ ...brewRestockForm, quantity: e.target.value })} autoFocus />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">{t('Notes (optional)')}</label>
                  <input className="admin-input" value={brewRestockForm.notes}
                    onChange={e => setBrewRestockForm({ ...brewRestockForm, notes: e.target.value })} placeholder={t('e.g. Received 20 hats')} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={handleBrewRestockSubmit}
                    disabled={brewRestocking || !brewRestockForm.quantity || Number(brewRestockForm.quantity) <= 0}>
                    {brewRestocking ? 'Restocking...' : 'Confirm Restock'}
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => setShowBrewRestockModal(false)}>{t('Cancel')}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'audience' && (
        <>
          {audienceLoading && <p style={{ color: 'var(--admin-text-muted)', padding: 20 }}>{t('Loading audience insights...')}</p>}
          {audience && (
            <>
              {/* KPI Cards */}
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>{t('Your Visitors')}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-primary)' }}>{audience.demographics?.totalParticipants || 0}</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{t('checked in here')}</div>
                </div>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>{t('Completed Onboarding')}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-primary)' }}>{audience.demographics?.onboardedCount || 0}</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{t('{n}% of visitors', { n: audience.demographics?.onboardingRate || 0 })}</div>
                </div>
                <div className="admin-card" style={{ padding: 20 }}>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>{t('Local vs Visitor')}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--admin-primary)' }}>{audience.demographics?.localVsVisitor?.localPercent || 0}%</div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                    {t('{a} locals · {b} visitors', { a: audience.demographics?.localVsVisitor?.locals || 0, b: audience.demographics?.localVsVisitor?.visitors || 0 })}
                  </div>
                </div>
              </div>

              {/* Top Vibes */}
              {audience.demographics?.byVibe && Object.keys(audience.demographics.byVibe).length > 0 && (
                <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{t('Your Crowd')}</h3>
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
                              <div style={{ background: 'var(--admin-primary)', borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width 0.3s' }} />
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
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{t('What Your Visitors Like to Drink')}</h3>
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
                              <div style={{ background: 'var(--admin-success)', borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width 0.3s' }} />
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
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{t('Busiest Days')}</h3>
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
                            background: isPeak ? 'var(--admin-primary)' : 'rgba(255,255,255,0.15)',
                          }} />
                          <span style={{ fontSize: 10, color: isPeak ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>
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
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{t('Gender Split')}</h3>
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
                  {t('Refresh Data')}
                </button>
              </div>
            </>
          )}
          {!audienceLoading && !audience && (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--admin-text-muted)' }}>{t('No audience data available yet. Check-ins will populate this tab.')}</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}