import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  getTrailOverview, getTrailEvents, getAdminLeaderboard, exportParticipants,
  deleteEvent, updateEvent, createTrailEvent, getTrailBreweries, createBrewery, updateBrewery,
  deleteBrewery, getSideQuests, createSideQuest, updateSideQuest, deleteSideQuest,
  getTrailBeerRatings, getMergeSuggestions, mergeRatings, createBreweryStaff, getBreweryLogin,
  getTrailMerchandise, createMerchandiseItem, updateMerchandiseItem, restockMerchandise,
  TRAIL_ID
} from './adminApi';

const generateStaffEmail = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@aletrail.com';
const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#f97316', '#4d5a3c', '#64748b', '#84cc16', '#fb923c', '#94a3b8'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HQDashboard() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [breweries, setBreweries] = useState([]);
  const [sideQuests, setSideQuests] = useState([]);
  const [beerRatings, setBeerRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', linkedTo: 'none', linkedId: '', category: 'event' });
  const [savingEvent, setSavingEvent] = useState(false);

  const [showBreweryForm, setShowBreweryForm] = useState(false);
  const [editingBrewery, setEditingBrewery] = useState(null);
  const [breweryForm, setBreweryForm] = useState({ name: '', address: '', district: '', pinCode: '', logoUrl: '', mapsUrl: '', instagramUrl: '', facebookUrl: '', descriptionEn: '', descriptionVn: '', status: 'active', staffEmail: '', staffPassword: '' });
  const [savingBrewery, setSavingBrewery] = useState(false);
  const [existingBreweryLogin, setExistingBreweryLogin] = useState(null);

  const [showQuestForm, setShowQuestForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [questForm, setQuestForm] = useState({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', reward: '', pin: '', address: '', district: '', mapsUrl: '', instagramUrl: '', facebookUrl: '', instagramHandle: '', hasVenueDashboard: false, status: 'active' });
  const [savingQuest, setSavingQuest] = useState(false);

  const [mergeSuggestions, setMergeSuggestions] = useState(null); // null = not loaded
  const [loadingMerge, setLoadingMerge] = useState(false);
  const [hqMergeTargets, setHqMergeTargets] = useState({}); // key: `${breweryId}|||${ratingName}` -> targetName
  const [hqMergingKey, setHqMergingKey] = useState(null);

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrQuest, setQrQuest] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  const [showBreweryQrModal, setShowBreweryQrModal] = useState(false);
  const [qrBrewery, setQrBrewery] = useState(null);
  const [qrBreweryUrl, setQrBreweryUrl] = useState('');
  const [loadingBreweryQr, setLoadingBreweryQr] = useState(false);

  // Merchandise / Stock
  const [merchandise, setMerchandise] = useState([]);
  const [showMerchForm, setShowMerchForm] = useState(false);
  const [merchForm, setMerchForm] = useState({ name: '', description: '', low_stock_threshold: 5 });
  const [savingMerch, setSavingMerch] = useState(false);
  const [restockForm, setRestockForm] = useState({ merchId: null, breweryId: null, quantity: '', notes: '' });
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restocking, setRestocking] = useState(false);

  const loadData = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const [overviewResult, eventsResult, leaderboardResult, breweriesResult, questsResult, ratingsResult, merchResult] = await Promise.all([
        getTrailOverview(TRAIL_ID, from, to),
        getTrailEvents(TRAIL_ID),
        getAdminLeaderboard(TRAIL_ID, 50),
        getTrailBreweries(TRAIL_ID).catch(() => ({ ok: false })),
        getSideQuests(TRAIL_ID).catch(() => ({ ok: false })),
        getTrailBeerRatings(TRAIL_ID).catch(() => ({ ok: false })),
        getTrailMerchandise(TRAIL_ID).catch(() => ({ ok: false }))
      ]);
      if (overviewResult.ok) setData(overviewResult);
      else setError(overviewResult.error || 'Failed to load data');
      if (eventsResult.ok) setEvents(eventsResult.events || []);
      if (leaderboardResult.ok) setLeaderboard(leaderboardResult.leaderboard || []);
      if (breweriesResult.ok) setBreweries(breweriesResult.breweries || []);
      if (questsResult.ok) setSideQuests(questsResult.sideQuests || []);
      if (ratingsResult.ok) setBeerRatings([...(ratingsResult.ratings || [])].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)));
      if (merchResult.ok) setMerchandise(merchResult.merchandise || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    let from, to;
    const now = new Date();
    to = now.toISOString();
    if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === 'custom' && fromDate && toDate) {
      from = new Date(fromDate).toISOString();
      to = new Date(toDate + 'T23:59:59').toISOString();
    }
    loadData(from, to);
  }, [dateRange, fromDate, toDate]);

  const formatTime = (ms) => {
    if (!ms) return '--';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleExport = async (format) => {
    setExporting(true);
    const result = await exportParticipants(TRAIL_ID, format);
    if (result.ok && format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else if (!result.ok) {
      alert(result.error || 'Export failed');
    }
    setExporting(false);
  };

  // ---- Merchandise handlers ----
  const handleCreateMerch = async () => {
    if (!merchForm.name.trim()) return;
    setSavingMerch(true);
    const result = await createMerchandiseItem(TRAIL_ID, merchForm);
    if (result.ok) {
      setMerchandise(prev => [...prev, { ...result.item, totalStock: 0, totalPickups: 0, byBrewery: {}, lowStockBreweries: [] }]);
      setShowMerchForm(false);
      setMerchForm({ name: '', description: '', low_stock_threshold: 5 });
    } else {
      alert(result.error || 'Failed to create');
    }
    setSavingMerch(false);
  };

  const handleRestockSubmit = async () => {
    const qty = Number(restockForm.quantity);
    if (!qty || qty <= 0) return;
    setRestocking(true);
    const result = await restockMerchandise(restockForm.breweryId, restockForm.merchId, qty, restockForm.notes);
    if (result.ok) {
      // Refresh merch data
      const merchResult = await getTrailMerchandise(TRAIL_ID).catch(() => ({ ok: false }));
      if (merchResult.ok) setMerchandise(merchResult.merchandise || []);
      setShowRestockModal(false);
      setRestockForm({ merchId: null, breweryId: null, quantity: '', notes: '' });
    } else {
      alert(result.error || 'Failed to restock');
    }
    setRestocking(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const result = await deleteEvent(eventId);
    if (result.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert(result.error || 'Failed to delete');
  };

  const handleCreateTrailEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      alert('Title (English) and Start Date/Time are required');
      return;
    }
    setSavingEvent(true);
    const eventData = {
      title: { en: eventForm.titleEn, vn: eventForm.titleVn || eventForm.titleEn },
      description: eventForm.descriptionEn ? { en: eventForm.descriptionEn, vn: eventForm.descriptionVn || eventForm.descriptionEn } : null,
      starts_at: new Date(eventForm.startsAt).toISOString(),
      ends_at: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
      link: eventForm.link || null,
      status: 'active',
      category: eventForm.category || 'event',
      ...(eventForm.linkedTo === 'brewery' && eventForm.linkedId ? { brewery_id: eventForm.linkedId } : {}),
      ...(eventForm.linkedTo === 'side_quest' && eventForm.linkedId ? { side_quest_id: eventForm.linkedId } : {}),
    };
    const result = await createTrailEvent(TRAIL_ID, eventData);
    if (result.ok) {
      setEvents([...events, result.event]);
      setShowEventForm(false);
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', linkedTo: 'none', linkedId: '', category: 'event' });
    } else {
      alert(result.error || 'Failed to create event');
    }
    setSavingEvent(false);
  };

  const openEditEvent = (event) => {
    const title = event.title || {};
    const desc = event.description || {};
    const toLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setEditingEvent(event);
    setEventForm({
      titleEn: title.en || (typeof event.title === 'string' ? event.title : ''),
      titleVn: title.vn || '',
      descriptionEn: desc.en || (typeof event.description === 'string' ? event.description : ''),
      descriptionVn: desc.vn || '',
      startsAt: toLocal(event.startsAt),
      endsAt: toLocal(event.endsAt),
      link: event.link || '',
      linkedTo: 'none',
      linkedId: '',
      category: event.category || 'event',
    });
    setShowEventForm(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
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
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', linkedTo: 'none', linkedId: '', category: 'event' });
    } else {
      alert(result.error || 'Failed to update event');
    }
    setSavingEvent(false);
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '', linkedTo: 'none', linkedId: '', category: 'event' });
    setShowEventForm(true);
  };

  const openBreweryForm = async (brewery = null) => {
    setExistingBreweryLogin(null);
    if (brewery) {
      setEditingBrewery(brewery);
      const brewDesc = brewery.description || {};
      setBreweryForm({
        name: brewery.name || '',
        address: brewery.address || '',
        district: brewery.district || '',
        pinCode: brewery.pinCode || '',
        logoUrl: brewery.logoUrl || '',
        mapsUrl: brewery.maps_url || brewery.mapsUrl || '',
        instagramUrl: brewery.instagram_url || brewery.instagramUrl || '',
        facebookUrl: brewery.facebook_url || brewery.facebookUrl || '',
        descriptionEn: typeof brewDesc === 'string' ? brewDesc : (brewDesc.en || ''),
        descriptionVn: typeof brewDesc === 'string' ? '' : (brewDesc.vn || ''),
        status: brewery.status || 'active',
        staffEmail: '', staffPassword: generatePassword()
      });
      // Fetch existing login info
      getBreweryLogin(brewery.id).then(r => { if (r.ok && r.email) setExistingBreweryLogin(r.email); });
    } else {
      setEditingBrewery(null);
      setBreweryForm({ name: '', address: '', district: '', pinCode: '', logoUrl: '', mapsUrl: '', instagramUrl: '', facebookUrl: '', descriptionEn: '', descriptionVn: '', status: 'active', staffEmail: '', staffPassword: generatePassword() });
    }
    setShowBreweryForm(true);
  };

  const handleSaveBrewery = async () => {
    if (!breweryForm.name) {
      alert('Name is required');
      return;
    }
    if (breweryForm.pinCode && breweryForm.pinCode.length !== 4) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    setSavingBrewery(true);
    const breweryData = {
      name: breweryForm.name,
      address: breweryForm.address,
      district: breweryForm.district,
      ...(breweryForm.pinCode ? { pin_code: breweryForm.pinCode } : {}),
      logo_url: breweryForm.logoUrl,
      maps_url: breweryForm.mapsUrl || null,
      instagram_url: breweryForm.instagramUrl || null,
      facebook_url: breweryForm.facebookUrl || null,
      description: { en: breweryForm.descriptionEn || '', vn: breweryForm.descriptionVn || breweryForm.descriptionEn || '' },
      status: breweryForm.status
    };
    let result;
    if (editingBrewery) {
      result = await updateBrewery(editingBrewery.id, breweryData);
      if (result.ok) {
        setBreweries(breweries.map(b => b.id === editingBrewery.id ? { ...b, ...breweryData, pinCode: breweryData.pin_code, logoUrl: breweryData.logo_url, mapsUrl: breweryData.maps_url, instagramUrl: breweryData.instagram_url, facebookUrl: breweryData.facebook_url } : b));
        // Reset staff credentials if both provided
        if (breweryForm.staffEmail && breweryForm.staffPassword) {
          const staffResult = await createBreweryStaff(editingBrewery.id, breweryForm.staffEmail, breweryForm.staffPassword);
          if (!staffResult.ok) {
            alert(`Brewery saved, but staff credential reset failed: ${staffResult.error || 'Unknown error'}`);
          } else {
            alert(`✓ Staff credentials updated!\nEmail: ${breweryForm.staffEmail}\nPassword: ${breweryForm.staffPassword}`);
          }
        }
      }
    } else {
      result = await createBrewery(TRAIL_ID, breweryData);
      if (result.ok && result.brewery) {
        setBreweries([...breweries, result.brewery]);
        // Create brewery staff account if credentials provided
        const staffEmail = breweryForm.staffEmail || generateStaffEmail(breweryForm.name);
        const staffPassword = breweryForm.staffPassword;
        if (staffEmail && staffPassword) {
          const staffResult = await createBreweryStaff(result.brewery.id, staffEmail, staffPassword);
          if (!staffResult.ok) {
            alert(`Brewery saved, but staff account creation failed: ${staffResult.error || 'Unknown error'}\n\nYou can set up credentials manually later.`);
          } else {
            alert(`✓ Brewery created!\n\nStaff login credentials:\nEmail: ${staffEmail}\nPassword: ${staffPassword}\n\nPlease share these with the venue.`);
          }
        }
      }
    }
    if (result.ok) {
      setShowBreweryForm(false);
      setEditingBrewery(null);
    } else {
      alert(result.error || 'Failed to save brewery');
    }
    setSavingBrewery(false);
  };

  const handleDeleteBrewery = async (breweryId) => {
    if (!confirm('Delete this brewery?')) return;
    const result = await deleteBrewery(breweryId, false);
    if (result.ok) setBreweries(breweries.map(b => b.id === breweryId ? { ...b, status: 'inactive' } : b));
    else alert(result.error || 'Failed to delete');
  };

  const handleToggleBreweryClosed = async (brewery) => {
    const newStatus = brewery.status === 'temporarily_closed' ? 'active' : 'temporarily_closed';
    const result = await updateBrewery(brewery.id, { status: newStatus });
    if (result.ok) {
      setBreweries(breweries.map(b => b.id === brewery.id ? { ...b, status: newStatus } : b));
    } else {
      alert(result.error || 'Failed to update status');
    }
  };

  const openQuestForm = (quest = null) => {
    if (quest) {
      setEditingQuest(quest);
      const title = quest.title || {};
      const desc = quest.description || {};
      setQuestForm({
        titleEn: typeof title === 'string' ? title : (title.en || ''),
        titleVn: typeof title === 'string' ? '' : (title.vn || ''),
        descriptionEn: typeof desc === 'string' ? desc : (desc.en || ''),
        descriptionVn: typeof desc === 'string' ? '' : (desc.vn || ''),
        reward: quest.reward || '',
        pin: quest.pin || '',
        address: quest.address || '',
        district: quest.district || '',
        mapsUrl: quest.maps_url || quest.mapsUrl || '',
        instagramUrl: quest.instagram_url || quest.instagramUrl || '',
        facebookUrl: quest.facebook_url || quest.facebookUrl || '',
        instagramHandle: quest.instagram_handle || quest.instagramHandle || '',
        hasVenueDashboard: quest.hasVenueDashboard || false,
        status: quest.status || 'active'
      });
    } else {
      setEditingQuest(null);
      setQuestForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', reward: '', pin: '', address: '', district: '', mapsUrl: '', instagramUrl: '', facebookUrl: '', instagramHandle: '', hasVenueDashboard: false, status: 'active' });
    }
    setShowQuestForm(true);
  };

  const handleSaveQuest = async () => {
    if (!questForm.titleEn) {
      alert('Title (English) is required');
      return;
    }
    if (questForm.pin && questForm.pin.length !== 4) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    setSavingQuest(true);
    try {
      const questData = {
        title: { en: questForm.titleEn, vn: questForm.titleVn || questForm.titleEn },
        description: { en: questForm.descriptionEn, vn: questForm.descriptionVn || questForm.descriptionEn },
        reward: questForm.reward,
        ...(questForm.pin ? { pin_code: questForm.pin } : {}),
        address: questForm.address,
        district: questForm.district,
        maps_url: questForm.mapsUrl || null,
        instagram_url: questForm.instagramUrl || null,
        facebook_url: questForm.facebookUrl || null,
        instagram_handle: questForm.instagramHandle || null,
        status: questForm.status
      };
      let result;
      if (editingQuest) {
        result = await updateSideQuest(editingQuest.id, questData);
        if (result.ok) setSideQuests(sideQuests.map(q => q.id === editingQuest.id ? { ...q, ...questData } : q));
      } else {
        result = await createSideQuest(TRAIL_ID, questData);
        if (result.ok) {
          const refreshed = await getSideQuests(TRAIL_ID);
          if (refreshed.ok) setSideQuests(refreshed.sideQuests || []);
        }
      }
      if (result.ok) {
        if (!editingQuest && questForm.hasVenueDashboard) {
          await createBrewery(TRAIL_ID, {
            name: questForm.titleEn,
            address: questForm.address || '',
            district: questForm.district || '',
            pinCode: questForm.pin || '',
            status: 'active',
          });
          const breweriesResult = await getTrailBreweries(TRAIL_ID);
          if (breweriesResult.ok) setBreweries(breweriesResult.breweries || []);
        }
        setShowQuestForm(false);
        setEditingQuest(null);
      } else {
        alert(result.error || 'Failed to save quest');
      }
    } catch (err) {
      console.error('Save quest error:', err);
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingQuest(false);
    }
  };

  const handleDeleteQuest = async (questId) => {
    if (!confirm('Delete this side quest?')) return;
    const result = await deleteSideQuest(questId);
    if (result.ok) setSideQuests(sideQuests.filter(q => q.id !== questId));
    else alert(result.error || 'Failed to delete');
  };

  const handleGenerateQR = async (quest) => {
    setQrQuest(quest);
    setQrUrl('');
    setLoadingQr(true);
    setShowQrModal(true);
    try {
      const url = `${window.location.origin}/side-quest/${quest.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
      setQrUrl(dataUrl);
    } catch (err) {
      alert('Failed to generate QR code');
    }
    setLoadingQr(false);
  };

  const handleGenerateBreweryQR = async (brewery) => {
    setQrBrewery(brewery);
    setQrBreweryUrl('');
    setLoadingBreweryQr(true);
    setShowBreweryQrModal(true);
    try {
      const url = `${window.location.origin}/checkin/${brewery.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
      setQrBreweryUrl(dataUrl);
    } catch (err) {
      alert('Failed to generate QR code');
    }
    setLoadingBreweryQr(false);
  };

  const handleLoadMergeSuggestions = async () => {
    setLoadingMerge(true);
    const result = await getMergeSuggestions(TRAIL_ID);
    if (result.ok) setMergeSuggestions(result.breweries || []);
    else alert(result.error || 'Failed to load merge suggestions');
    setLoadingMerge(false);
  };

  const handleHqMerge = async (breweryId, oldName) => {
    const key = `${breweryId}|||${oldName}`;
    const newName = hqMergeTargets[key];
    if (!newName) return;
    setHqMergingKey(key);
    const result = await mergeRatings(breweryId, oldName, newName);
    if (result.ok) {
      // Remove this suggestion from the list
      setMergeSuggestions(prev =>
        prev.map(b => b.id === breweryId
          ? { ...b, unmatched: b.unmatched.filter(u => u.name !== oldName) }
          : b
        ).filter(b => b.unmatched.length > 0)
      );
      setHqMergeTargets(prev => { const n = { ...prev }; delete n[key]; return n; });
    } else {
      alert(result.error || 'Merge failed');
    }
    setHqMergingKey(null);
  };

  if (loading && !data) {
    return <div className="admin-loading"><div className="admin-spinner" /></div>;
  }

  if (error && !data) {
    return <div className="admin-content"><div className="admin-error">{error}</div></div>;
  }

  const totals = data?.totals || {};
  const completion = data?.completion || {};
  const checkinsByBrewery = data?.checkinsByBrewery || [];
  const dropoffFunnel = data?.dropoffFunnel || [];
  const busiest = data?.busiest || {};
  const participantsByCountry = data?.participantsByCountry || [];
  const avgRatingByBrewery = data?.avgRatingByBrewery || [];
  const checkinsTrend = data?.checkinsTrendDaily || [];
  const journeyStats = data?.journeyStats || {};
  const funnelData = dropoffFunnel.map(d => ({ name: `${d.stamps} stamps`, value: d.count }));
  const trailEvents = events.filter(e => !e.breweryId && !e.sideQuestId);
  const breweryEvents = events.filter(e => e.breweryId);
  const sideQuestEvents = events.filter(e => e.sideQuestId);
  const activeBreweries = breweries.filter(b => b.status !== 'inactive');
  const inactiveBreweries = breweries.filter(b => b.status === 'inactive');

  return (
    <div className="admin-content">
      <h1 className="admin-page-title">HQ Dashboard</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'breweries' ? 'active' : ''}`} onClick={() => setActiveTab('breweries')}>Breweries ({breweries.length})</button>
        <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
        <button className={`admin-tab ${activeTab === 'sidequests' ? 'active' : ''}`} onClick={() => setActiveTab('sidequests')}>Side Quests ({sideQuests.length})</button>
        <button className={`admin-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
        <button className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Stock{merchandise.some(m => m.lowStockBreweries?.length > 0) ? ' ⚠️' : ''}</button>
        <button className={`admin-tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>Export</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
            <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
            <input type="date" className="admin-date-input" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setDateRange('custom'); }} />
            <span style={{ color: 'var(--admin-text-muted)' }}>to</span>
            <input type="date" className="admin-date-input" value={toDate} onChange={(e) => { setToDate(e.target.value); setDateRange('custom'); }} />
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card"><div className="admin-kpi-label">Total Check-ins</div><div className="admin-kpi-value primary">{totals.checkins || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">New Participants</div><div className="admin-kpi-value primary">{totals.newParticipants || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Hat Claims</div><div className="admin-kpi-value success">{totals.hatClaims || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Ratings</div><div className="admin-kpi-value">{totals.ratingsCount || 0}</div><div className="admin-kpi-subtext">Avg: {totals.ratingsAvg?.toFixed(1) || '--'} stars</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Completed Trails</div><div className="admin-kpi-value success">{completion.completedCount || 0}</div><div className="admin-kpi-subtext">{completion.completionRatePercent?.toFixed(1) || 0}% completion rate</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Avg Completion Time</div><div className="admin-kpi-value">{formatTime(completion.avgTimeToCompleteMs)}</div></div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card"><h3 className="admin-card-title">Top Starting Breweries</h3>{(journeyStats.topStartingBreweries || []).length === 0 ? (<div className="admin-empty">No data yet</div>) : (<table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead><tbody>{(journeyStats.topStartingBreweries || []).map((b, i) => (<tr key={b.breweryId}><td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td><td>{b.breweryName}</td><td><strong>{b.count}</strong></td></tr>))}</tbody></table>)}</div>
            <div className="admin-card"><h3 className="admin-card-title">Top Ending Breweries</h3>{(journeyStats.topEndingBreweries || []).length === 0 ? (<div className="admin-empty">No data yet</div>) : (<table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead><tbody>{(journeyStats.topEndingBreweries || []).map((b, i) => (<tr key={b.breweryId}><td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td><td>{b.breweryName}</td><td><strong>{b.count}</strong></td></tr>))}</tbody></table>)}</div>
            <div className="admin-card"><h3 className="admin-card-title">Top Hat Claim Locations</h3>{(journeyStats.topHatClaimLocations || []).length === 0 ? (<div className="admin-empty">No data yet</div>) : (<table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead><tbody>{(journeyStats.topHatClaimLocations || []).map((b, i) => (<tr key={b.breweryId}><td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td><td>{b.breweryName}</td><td><strong>{b.count}</strong></td></tr>))}</tbody></table>)}</div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card"><h3 className="admin-card-title">Check-ins by Brewery</h3><table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Check-ins</th></tr></thead><tbody>{checkinsByBrewery.sort((a, b) => b.count - a.count).map((brewery, index) => (<tr key={brewery.breweryId}><td><span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>{index + 1}</span></td><td>{brewery.breweryName}</td><td><strong>{brewery.count}</strong></td></tr>))}</tbody></table></div>
            <div className="admin-card"><h3 className="admin-card-title">Daily Check-ins</h3><div className="admin-chart-container"><ResponsiveContainer width="100%" height="100%"><LineChart data={checkinsTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" /><XAxis dataKey="date" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} /><YAxis tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} /><Tooltip contentStyle={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8 }} /><Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} /></LineChart></ResponsiveContainer></div></div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card"><h3 className="admin-card-title">Drop-off Funnel</h3><div className="admin-chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={funnelData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" /><XAxis type="number" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} /><YAxis type="category" dataKey="name" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} width={80} /><Tooltip contentStyle={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8 }} /><Bar dataKey="value" fill="#4d5a3c" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>
            <div className="admin-card"><h3 className="admin-card-title">Ratings by Brewery</h3>{avgRatingByBrewery.length === 0 ? (<div className="admin-empty">No ratings yet</div>) : (<table className="admin-table"><thead><tr><th>Brewery</th><th>Avg Rating</th><th>Count</th></tr></thead><tbody>{avgRatingByBrewery.sort((a, b) => b.avgRating - a.avgRating).map((brewery) => (<tr key={brewery.breweryId}><td>{brewery.breweryName}</td><td>{brewery.avgRating?.toFixed(1)} stars</td><td>{brewery.ratingsCount}</td></tr>))}</tbody></table>)}</div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card"><h3 className="admin-card-title">By Country</h3>{participantsByCountry.length === 0 ? (<div className="admin-empty">No data</div>) : (<div className="admin-chart-container"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={participantsByCountry} cx="50%" cy="50%" labelLine={false} label={({ country, count }) => `${country}: ${count}`} outerRadius={80} dataKey="count" nameKey="country">{participantsByCountry.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>)}</div>
            <div className="admin-card"><h3 className="admin-card-title">Busiest Times</h3><div style={{ padding: '20px 0' }}><div style={{ marginBottom: 16 }}><div className="admin-kpi-label">Busiest Day</div><div style={{ fontSize: 24, fontWeight: 600 }}>{DAY_NAMES[busiest.busiestDayOfWeek] || '--'}</div></div><div><div className="admin-kpi-label">Peak Hour</div><div style={{ fontSize: 24, fontWeight: 600 }}>{busiest.busiestHourOfDay !== undefined ? `${busiest.busiestHourOfDay}:00 - ${busiest.busiestHourOfDay + 1}:00` : '--'}</div></div></div></div>
            <div className="admin-card"><h3 className="admin-card-title">Top Rated Beers</h3>{!data?.topRatedBeers?.length ? (<div className="admin-empty"><p>Not enough ratings yet</p><p style={{ fontSize: 12, marginTop: 8 }}>Needs 3+ ratings per beer</p></div>) : (<table className="admin-table"><thead><tr><th>Beer</th><th>Brewery</th><th>Rating</th></tr></thead><tbody>{(data?.topRatedBeers || []).slice(0, 5).map((beer, i) => (<tr key={i}><td>{beer.beerName}</td><td style={{ color: 'var(--admin-text-muted)' }}>{beer.breweryName}</td><td>{beer.avgRating?.toFixed(1)} stars</td></tr>))}</tbody></table>)}</div>
          </div>
        </>
      )}

      {activeTab === 'breweries' && (
        <>
          {showBreweryForm && (
            <div className="admin-modal-overlay" onClick={() => setShowBreweryForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingBrewery ? 'Edit Brewery' : 'Add Brewery'}</h3>
                <div className="admin-form-group"><label className="admin-form-label">Name *</label><input type="text" className="admin-form-input" value={breweryForm.name} onChange={(e) => setBreweryForm(prev => ({...prev, name: e.target.value}))} placeholder="Brewery Name" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Address</label><input type="text" className="admin-form-input" value={breweryForm.address} onChange={(e) => setBreweryForm(prev => ({...prev, address: e.target.value}))} placeholder="123 Beer Street" /></div>
                <div className="admin-form-group"><label className="admin-form-label">District</label><input type="text" className="admin-form-input" value={breweryForm.district} onChange={(e) => setBreweryForm(prev => ({...prev, district: e.target.value}))} placeholder="District 1" /></div>
                <div className="admin-form-group"><label className="admin-form-label">PIN Code (4 digits)</label><input type="text" className="admin-form-input" value={breweryForm.pinCode} onChange={(e) => setBreweryForm(prev => ({...prev, pinCode: e.target.value.replace(/\D/g, '').slice(0, 4)}))} placeholder="1234" maxLength="4" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Logo URL</label><input type="text" className="admin-form-input" value={breweryForm.logoUrl} onChange={(e) => setBreweryForm(prev => ({...prev, logoUrl: e.target.value}))} placeholder="https://..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Maps URL</label><input type="text" className="admin-form-input" value={breweryForm.mapsUrl} onChange={(e) => setBreweryForm(prev => ({...prev, mapsUrl: e.target.value}))} placeholder="https://maps.google.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Instagram URL</label><input type="text" className="admin-form-input" value={breweryForm.instagramUrl} onChange={(e) => setBreweryForm(prev => ({...prev, instagramUrl: e.target.value}))} placeholder="https://instagram.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Facebook URL</label><input type="text" className="admin-form-input" value={breweryForm.facebookUrl} onChange={(e) => setBreweryForm(prev => ({...prev, facebookUrl: e.target.value}))} placeholder="https://facebook.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description (English)</label><textarea className="admin-form-input" value={breweryForm.descriptionEn} onChange={(e) => setBreweryForm(prev => ({...prev, descriptionEn: e.target.value}))} rows={3} placeholder="Describe this brewery..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description (Vietnamese)</label><textarea className="admin-form-input" value={breweryForm.descriptionVn} onChange={(e) => setBreweryForm(prev => ({...prev, descriptionVn: e.target.value}))} rows={3} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Status</label><select className="admin-form-input" value={breweryForm.status} onChange={(e) => setBreweryForm(prev => ({...prev, status: e.target.value}))}><option value="active">Active</option><option value="temporarily_closed">Temporarily Closed</option><option value="inactive">Inactive</option></select></div>
                <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: 20, paddingTop: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Brewery Login</p>
                  {existingBreweryLogin ? (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--admin-success)' }}>✓ Login exists: </span>
                      <code style={{ fontSize: 13 }}>{existingBreweryLogin}</code>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>Fill fields below to reset credentials.</p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginBottom: 12 }}>{editingBrewery ? 'No login yet. Fill below to create one.' : 'Creates a /admin login for the venue.'}</p>
                  )}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Login Email</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="email" className="admin-form-input" value={breweryForm.staffEmail} onChange={(e) => setBreweryForm(prev => ({...prev, staffEmail: e.target.value}))} placeholder={existingBreweryLogin ? 'leave blank to keep' : 'auto-generated from name'} />
                      <button type="button" className="admin-btn admin-btn-small" style={{ whiteSpace: 'nowrap' }} onClick={() => setBreweryForm(prev => ({...prev, staffEmail: generateStaffEmail(prev.name || 'brewery')}))}>Auto</button>
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Temporary Password</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" className="admin-form-input" value={breweryForm.staffPassword} onChange={(e) => setBreweryForm(prev => ({...prev, staffPassword: e.target.value}))} placeholder={existingBreweryLogin ? 'leave blank to keep' : 'auto-generated'} style={{ fontFamily: 'monospace' }} />
                      <button type="button" className="admin-btn admin-btn-small" style={{ whiteSpace: 'nowrap' }} onClick={() => setBreweryForm(prev => ({...prev, staffPassword: generatePassword()}))}>New</button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button type="button" className="admin-btn admin-btn-primary" onClick={handleSaveBrewery} disabled={savingBrewery}>{savingBrewery ? 'Saving...' : 'Save Brewery'}</button><button type="button" className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowBreweryForm(false)}>Cancel</button></div>
              </div>
            </div>
          )}
          {showBreweryQrModal && qrBrewery && (
            <div className="admin-modal-overlay" onClick={() => setShowBreweryQrModal(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 4 }}>QR Code</h3>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: 20, fontSize: 14 }}>{qrBrewery.name}</p>
                {loadingBreweryQr ? (
                  <div className="admin-spinner" style={{ margin: '40px auto' }} />
                ) : qrBreweryUrl ? (
                  <>
                    <img src={qrBreweryUrl} alt="QR Code" style={{ width: 200, height: 200, imageRendering: 'pixelated', display: 'block', margin: '0 auto' }} />
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>{window.location.origin}/checkin/{qrBrewery.id}</p>
                    <div style={{ marginTop: 16 }}>
                      <a href={qrBreweryUrl} download={`brewery-qr-${qrBrewery.name.replace(/\s+/g, '-').toLowerCase()}.png`} className="admin-btn admin-btn-secondary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>Download PNG</a>
                    </div>
                  </>
                ) : null}
                <div style={{ marginTop: 16 }}>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)', width: 'auto' }} onClick={() => setShowBreweryQrModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>Active Breweries ({activeBreweries.length})</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openBreweryForm()}>+ Add Brewery</button></div>
            {activeBreweries.length === 0 ? (<div className="admin-empty">No active breweries</div>) : (
              <table className="admin-table"><thead><tr><th>Name</th><th>District</th><th>PIN</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                {activeBreweries.map((brewery) => (<tr key={brewery.id}><td><strong>{brewery.name}</strong><div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{brewery.address}</div></td><td>{brewery.district || '--'}</td><td><code>{brewery.pinCode || '--'}</code></td><td><span className={`admin-badge ${brewery.status === 'temporarily_closed' ? 'inactive' : 'active'}`} style={{ cursor: 'pointer' }} onClick={() => handleToggleBreweryClosed(brewery)} title="Click to toggle">{brewery.status === 'temporarily_closed' ? '🔴 Temp Closed' : '🟢 Active'}</span></td><td><button className="admin-btn-small admin-btn-secondary" style={{ marginRight: 6 }} onClick={() => handleGenerateBreweryQR(brewery)}>QR</button><button className="admin-btn-small" style={{ marginRight: 6 }} onClick={() => openBreweryForm(brewery)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteBrewery(brewery.id)}>Delete</button></td></tr>))}
              </tbody></table>
            )}
          </div>
          {inactiveBreweries.length > 0 && (<div className="admin-card" style={{ marginTop: 20 }}><h3 className="admin-card-title">Inactive Breweries ({inactiveBreweries.length})</h3><table className="admin-table"><thead><tr><th>Name</th><th>District</th><th>Actions</th></tr></thead><tbody>{inactiveBreweries.map((brewery) => (<tr key={brewery.id} style={{ opacity: 0.6 }}><td>{brewery.name}</td><td>{brewery.district || '--'}</td><td><button className="admin-btn-small" onClick={() => openBreweryForm(brewery)}>Reactivate</button></td></tr>))}</tbody></table></div>)}
        </>
      )}

      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => setShowEventForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingEvent ? 'Edit Event' : 'Create Trail Event'}</h3>
                <div className="admin-form-group"><label className="admin-form-label">Title (English) *</label><input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} placeholder="Ale Trail Kickoff Party" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Title (Vietnamese)</label><input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description (English)</label><textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Start Date/Time *</label><input type="datetime-local" className="admin-form-input" value={eventForm.startsAt} onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">End Date/Time</label><input type="datetime-local" className="admin-form-input" value={eventForm.endsAt} onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Link (optional)</label><input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Category</label><select className="admin-form-input" value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})}><option value="event">Event</option><option value="new_release">New Release</option></select></div>
                <div className="admin-form-group"><label className="admin-form-label">Link to venue</label><select className="admin-form-input" value={eventForm.linkedTo} onChange={(e) => setEventForm({...eventForm, linkedTo: e.target.value, linkedId: ''})}><option value="none">None (trail-wide)</option><option value="brewery">Brewery</option><option value="side_quest">Side Quest</option></select></div>
                {eventForm.linkedTo === 'brewery' && (<div className="admin-form-group"><label className="admin-form-label">Select brewery</label><select className="admin-form-input" value={eventForm.linkedId} onChange={(e) => setEventForm({...eventForm, linkedId: e.target.value})}><option value="">— choose —</option>{breweries.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}</select></div>)}
                {eventForm.linkedTo === 'side_quest' && (<div className="admin-form-group"><label className="admin-form-label">Select side quest</label><select className="admin-form-input" value={eventForm.linkedId} onChange={(e) => setEventForm({...eventForm, linkedId: e.target.value})}><option value="">— choose —</option>{sideQuests.map(q => (<option key={q.id} value={q.id}>{typeof q.title === 'string' ? q.title : (q.title?.en || 'Untitled')}</option>))}</select></div>)}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button className="admin-btn admin-btn-primary" onClick={editingEvent ? handleUpdateEvent : handleCreateTrailEvent} disabled={savingEvent}>{savingEvent ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}</button><button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>Cancel</button></div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>Trail-Wide Events ({trailEvents.length})</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={openCreateEvent}>+ Create Event</button></div>
            {trailEvents.length === 0 ? (<div className="admin-empty">No trail-wide events yet</div>) : (<table className="admin-table"><thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{trailEvents.map((event) => (<tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td><span className={`admin-badge ${event.category === 'new_release' ? 'active' : ''}`}>{event.category === 'new_release' ? 'New Release' : 'Event'}</span></td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td><td><div style={{ display: 'flex', gap: 6 }}><button className="admin-btn-small" style={{ background: 'var(--admin-accent)', color: '#fff' }} onClick={() => openEditEvent(event)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></div></td></tr>))}</tbody></table>)}
          </div>
          <div className="admin-card" style={{ marginTop: 20 }}><h3 className="admin-card-title">Brewery Events ({breweryEvents.length})</h3>{breweryEvents.length === 0 ? (<div className="admin-empty">No brewery events yet</div>) : (<table className="admin-table"><thead><tr><th>Event</th><th>Brewery</th><th>Date</th><th>Actions</th></tr></thead><tbody>{breweryEvents.map((event) => (<tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td>{event.breweryName}</td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><div style={{ display: 'flex', gap: 6 }}><button className="admin-btn-small" style={{ background: 'var(--admin-accent)', color: '#fff' }} onClick={() => openEditEvent(event)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></div></td></tr>))}</tbody></table>)}</div>
          <div className="admin-card" style={{ marginTop: 20 }}><h3 className="admin-card-title">Side Quest Events ({sideQuestEvents.length})</h3>{sideQuestEvents.length === 0 ? (<div className="admin-empty">No side quest events yet</div>) : (<table className="admin-table"><thead><tr><th>Event</th><th>Side Quest</th><th>Date</th><th>Actions</th></tr></thead><tbody>{sideQuestEvents.map((event) => (<tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td>{event.sideQuestTitle || event.sideQuestId || '--'}</td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><div style={{ display: 'flex', gap: 6 }}><button className="admin-btn-small" style={{ background: 'var(--admin-accent)', color: '#fff' }} onClick={() => openEditEvent(event)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></div></td></tr>))}</tbody></table>)}</div>
        </>
      )}

      {activeTab === 'sidequests' && (
        <>
          {showQuestForm && (
            <div className="admin-modal-overlay" onClick={() => setShowQuestForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>{editingQuest ? 'Edit Side Quest' : 'Create Side Quest'}</h3>
                <div className="admin-form-group"><label className="admin-form-label">Title (English) *</label><input type="text" className="admin-form-input" value={questForm.titleEn} onChange={(e) => setQuestForm(prev => ({...prev, titleEn: e.target.value}))} placeholder="Visit all 8 breweries in one day" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Title (Vietnamese)</label><input type="text" className="admin-form-input" value={questForm.titleVn} onChange={(e) => setQuestForm(prev => ({...prev, titleVn: e.target.value}))} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description (English)</label><textarea className="admin-form-input" value={questForm.descriptionEn} onChange={(e) => setQuestForm(prev => ({...prev, descriptionEn: e.target.value}))} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description (Vietnamese)</label><textarea className="admin-form-input" value={questForm.descriptionVn} onChange={(e) => setQuestForm(prev => ({...prev, descriptionVn: e.target.value}))} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Reward</label><input type="text" className="admin-form-input" value={questForm.reward} onChange={(e) => setQuestForm(prev => ({...prev, reward: e.target.value}))} placeholder="Free sticker" /></div>
                <div className="admin-form-group"><label className="admin-form-label">PIN Code (4 digits){editingQuest ? ' (leave blank to keep existing)' : ' *'}</label><input type="text" className="admin-form-input" value={questForm.pin} onChange={(e) => setQuestForm(prev => ({...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4)}))} placeholder="1234" maxLength="4" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Address</label><input type="text" className="admin-form-input" value={questForm.address} onChange={(e) => setQuestForm(prev => ({...prev, address: e.target.value}))} placeholder="123 Beer Street" /></div>
                <div className="admin-form-group"><label className="admin-form-label">District</label><input type="text" className="admin-form-input" value={questForm.district} onChange={(e) => setQuestForm(prev => ({...prev, district: e.target.value}))} placeholder="District 1" /></div>
                <div className="admin-form-group"><label className="admin-form-label">Maps URL</label><input type="text" className="admin-form-input" value={questForm.mapsUrl} onChange={(e) => setQuestForm(prev => ({...prev, mapsUrl: e.target.value}))} placeholder="https://maps.google.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Instagram URL</label><input type="text" className="admin-form-input" value={questForm.instagramUrl} onChange={(e) => setQuestForm(prev => ({...prev, instagramUrl: e.target.value}))} placeholder="https://instagram.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Facebook URL</label><input type="text" className="admin-form-input" value={questForm.facebookUrl} onChange={(e) => setQuestForm(prev => ({...prev, facebookUrl: e.target.value}))} placeholder="https://facebook.com/..." /></div>
                <div className="admin-form-group"><label className="admin-form-label">Instagram Handle</label><input type="text" className="admin-form-input" value={questForm.instagramHandle} onChange={(e) => setQuestForm(prev => ({...prev, instagramHandle: e.target.value}))} placeholder="@yourvenue" /></div>
                {!editingQuest && (<div className="admin-form-group"><label className="admin-form-label">Has venue dashboard?</label><div style={{ display: 'flex', gap: 8, marginTop: 4 }}><button type="button" className="admin-btn admin-btn-small" style={{ width: 'auto', background: questForm.hasVenueDashboard ? '#f97316' : 'var(--admin-border)', color: questForm.hasVenueDashboard ? '#fff' : 'var(--admin-text)' }} onClick={() => setQuestForm(prev => ({...prev, hasVenueDashboard: true}))}>Yes</button><button type="button" className="admin-btn admin-btn-small" style={{ width: 'auto', background: !questForm.hasVenueDashboard ? '#f97316' : 'var(--admin-border)', color: !questForm.hasVenueDashboard ? '#fff' : 'var(--admin-text)' }} onClick={() => setQuestForm(prev => ({...prev, hasVenueDashboard: false}))}>No</button></div>{questForm.hasVenueDashboard && <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6 }}>A brewery dashboard entry will be created for this venue using the title, address, district, and PIN above.</p>}</div>)}
                <div className="admin-form-group"><label className="admin-form-label">Status</label><select className="admin-form-input" value={questForm.status} onChange={(e) => setQuestForm(prev => ({...prev, status: e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button type="button" className="admin-btn admin-btn-primary" onClick={handleSaveQuest} disabled={savingQuest}>{savingQuest ? 'Saving...' : 'Save Quest'}</button><button type="button" className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowQuestForm(false)}>Cancel</button></div>
              </div>
            </div>
          )}
          {showQrModal && qrQuest && (
            <div className="admin-modal-overlay" onClick={() => setShowQrModal(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 4 }}>QR Code</h3>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: 20, fontSize: 14 }}>{typeof qrQuest.title === 'string' ? qrQuest.title : (qrQuest.title?.en || 'Side Quest')}</p>
                {loadingQr ? (
                  <div className="admin-spinner" style={{ margin: '40px auto' }} />
                ) : qrUrl ? (
                  <>
                    <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, imageRendering: 'pixelated', display: 'block', margin: '0 auto' }} />
                    <div style={{ marginTop: 16 }}>
                      <a href={qrUrl} download={`quest-qr-${qrQuest.id}.png`} className="admin-btn admin-btn-secondary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>Download PNG</a>
                    </div>
                  </>
                ) : null}
                <div style={{ marginTop: 16 }}>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)', width: 'auto' }} onClick={() => setShowQrModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>Side Quests ({sideQuests.length})</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openQuestForm()}>+ Create Quest</button></div>
            {sideQuests.length === 0 ? (<div className="admin-empty">No side quests yet</div>) : (<table className="admin-table"><thead><tr><th>Title</th><th>Reward</th><th>PIN</th><th>District</th><th>Status</th><th>Actions</th></tr></thead><tbody>{sideQuests.map((quest) => { const title = typeof quest.title === 'string' ? quest.title : (quest.title?.en || 'Untitled'); return (<tr key={quest.id}><td><strong>{title}</strong>{quest.address && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{quest.address}</div>}</td><td>{quest.reward || '--'}</td><td><code>{quest.pin || '--'}</code></td><td>{quest.district || '--'}</td><td><span className={`admin-badge ${quest.status === 'active' ? 'active' : 'inactive'}`}>{quest.status}</span></td><td style={{ whiteSpace: 'nowrap' }}><button className="admin-btn-small admin-btn-secondary" style={{ marginRight: 6 }} onClick={() => handleGenerateQR(quest)}>QR</button><button className="admin-btn-small" style={{ marginRight: 6 }} onClick={() => openQuestForm(quest)}>Edit</button><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteQuest(quest.id)}>Delete</button></td></tr>); })}</tbody></table>)}
          </div>
        </>
      )}

      {activeTab === 'leaderboard' && (
        <>
          <div className="admin-card"><h3 className="admin-card-title">Leaderboard (with Contact Info)</h3>{leaderboard.length === 0 ? (<div className="admin-empty">No completions yet</div>) : (<table className="admin-table"><thead><tr><th>Rank</th><th>Name</th><th>Email</th><th>Time</th><th>Completed</th></tr></thead><tbody>{leaderboard.map((entry) => (<tr key={entry.participantId}><td><span className={`admin-rank ${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : 'default'}`}>{entry.rank}</span></td><td><strong>{entry.displayName || entry.name || '--'}</strong></td><td><a href={`mailto:${entry.email}`} style={{ color: 'var(--admin-primary)' }}>{entry.email}</a></td><td>{formatTime(entry.completionTimeMs)}</td><td style={{ color: 'var(--admin-text-muted)' }}>{new Date(entry.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>))}</tbody></table>)}</div>
          <div className="admin-card" style={{ marginTop: 24 }}>
            <h3 className="admin-card-title">Beer Ratings</h3>
            {beerRatings.length === 0 ? (
              <div className="admin-empty">No ratings yet</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Beer Name</th>
                    <th>Brewery</th>
                    <th>Avg Rating</th>
                    <th># of Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {beerRatings.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{i + 1}</td>
                      <td><strong>{r.beer_name || '--'}</strong></td>
                      <td>{r.brewery_name || '--'}</td>
                      <td>{'★'.repeat(Math.round(r.average_rating || 0))}{'☆'.repeat(5 - Math.round(r.average_rating || 0))} <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{r.average_rating}/5</span></td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{r.total_ratings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Merge Ratings</h3>
              <button className="admin-btn admin-btn-secondary admin-btn-small" onClick={handleLoadMergeSuggestions} disabled={loadingMerge}>
                {loadingMerge ? 'Loading...' : mergeSuggestions === null ? 'Load Suggestions' : 'Refresh'}
              </button>
            </div>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              Find submitted beer names that don't match any brewery menu entry and reassign them.
            </p>
            {mergeSuggestions === null && !loadingMerge && (
              <div className="admin-empty">Click "Load Suggestions" to scan for mismatched beer names.</div>
            )}
            {mergeSuggestions !== null && mergeSuggestions.length === 0 && (
              <div className="admin-empty" style={{ color: 'var(--admin-success)' }}>All submitted names match menu entries.</div>
            )}
            {mergeSuggestions !== null && mergeSuggestions.length > 0 && mergeSuggestions.map((b) => (
              <div key={b.id} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--admin-text)' }}>{b.name}</div>
                <table className="admin-table">
                  <thead><tr><th>Submitted Name</th><th># Ratings</th><th>Reassign to</th><th></th></tr></thead>
                  <tbody>
                    {b.unmatched.map((u) => {
                      const key = `${b.id}|||${u.name}`;
                      return (
                        <tr key={u.name}>
                          <td><strong style={{ color: 'var(--admin-warning)' }}>{u.name}</strong></td>
                          <td>{u.count}</td>
                          <td>
                            {b.menuBeers.length === 0 ? (
                              <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No menu beers</span>
                            ) : (
                              <select
                                className="admin-form-input"
                                style={{ margin: 0 }}
                                value={hqMergeTargets[key] || ''}
                                onChange={(e) => setHqMergeTargets(prev => ({ ...prev, [key]: e.target.value }))}
                              >
                                <option value="">— keep as-is —</option>
                                {b.menuBeers.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td>
                            <button
                              className="admin-btn-small admin-btn-primary"
                              disabled={!hqMergeTargets[key] || hqMergingKey === key}
                              onClick={() => handleHqMerge(b.id, u.name)}
                            >
                              {hqMergingKey === key ? 'Merging...' : 'Merge'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'stock' && (
        <>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Merchandise Items</h3>
              <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={() => setShowMerchForm(true)}>+ Add Item</button>
            </div>

            {showMerchForm && (
              <div className="admin-card" style={{ background: 'var(--admin-bg-tertiary)', marginBottom: 16 }}>
                <div className="admin-form-group">
                  <label className="admin-label">Item Name *</label>
                  <input className="admin-input" value={merchForm.name} onChange={e => setMerchForm({ ...merchForm, name: e.target.value })} placeholder="e.g. Ale Trail Hat" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <input className="admin-input" value={merchForm.description} onChange={e => setMerchForm({ ...merchForm, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Low Stock Alert Threshold</label>
                  <input className="admin-input" type="number" value={merchForm.low_stock_threshold} onChange={e => setMerchForm({ ...merchForm, low_stock_threshold: Number(e.target.value) })} min="0" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={handleCreateMerch} disabled={savingMerch}>{savingMerch ? 'Saving...' : 'Create'}</button>
                  <button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => { setShowMerchForm(false); setMerchForm({ name: '', description: '', low_stock_threshold: 5 }); }}>Cancel</button>
                </div>
              </div>
            )}

            {merchandise.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)' }}>No merchandise items yet. Add your first item to start tracking stock.</p>
            ) : (
              <div>
                {merchandise.map(item => (
                  <div key={item.id} className="admin-card" style={{ marginBottom: 12, background: 'var(--admin-bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>{item.name}</h4>
                        {item.description && <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 8px', fontSize: 13 }}>{item.description}</p>}
                      </div>
                      <span className={`admin-badge ${item.active ? 'admin-badge-success' : 'admin-badge-error'}`}>{item.active ? 'Active' : 'Inactive'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Total Stock</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{item.totalStock}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Picked Up</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{item.totalPickups}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Low Stock Locations</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: item.lowStockBreweries?.length > 0 ? '#ef4444' : 'inherit' }}>
                          {item.lowStockBreweries?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Per-brewery breakdown */}
                    {Object.keys(item.byBrewery || {}).length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>By Location</div>
                        <table className="admin-table">
                          <thead>
                            <tr><th>Brewery</th><th>Stock</th><th>Pickups</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {Object.entries(item.byBrewery).map(([bId, info]) => {
                              const brew = breweries.find(b => b.id === bId);
                              const isLow = info.stock <= item.low_stock_threshold;
                              return (
                                <tr key={bId}>
                                  <td>{brew?.name || bId.slice(0, 8)}</td>
                                  <td style={{ color: isLow ? '#ef4444' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
                                    {info.stock}{isLow ? ' ⚠️' : ''}
                                  </td>
                                  <td>{info.pickups}</td>
                                  <td>
                                    <button className="admin-btn admin-btn-secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
                                      onClick={() => { setRestockForm({ merchId: item.id, breweryId: bId, quantity: '', notes: '' }); setShowRestockModal(true); }}>
                                      Restock
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Quick restock for breweries with no stock yet */}
                    {breweries.filter(b => b.status !== 'inactive' && !item.byBrewery?.[b.id]).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <details>
                          <summary style={{ fontSize: 12, color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                            Add stock to new locations ({breweries.filter(b => b.status !== 'inactive' && !item.byBrewery?.[b.id]).length} without stock)
                          </summary>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {breweries.filter(b => b.status !== 'inactive' && !item.byBrewery?.[b.id]).map(b => (
                              <button key={b.id} className="admin-btn admin-btn-secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
                                onClick={() => { setRestockForm({ merchId: item.id, breweryId: b.id, quantity: '', notes: '' }); setShowRestockModal(true); }}>
                                + {b.name}
                              </button>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restock Modal */}
          {showRestockModal && (
            <div className="admin-modal-overlay" onClick={() => setShowRestockModal(false)}>
              <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h3 className="admin-card-title">Restock</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                  {merchandise.find(m => m.id === restockForm.merchId)?.name} → {breweries.find(b => b.id === restockForm.breweryId)?.name}
                </p>
                <div className="admin-form-group">
                  <label className="admin-label">Quantity to Add</label>
                  <input className="admin-input" type="number" min="1" value={restockForm.quantity}
                    onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })} autoFocus />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Notes (optional)</label>
                  <input className="admin-input" value={restockForm.notes}
                    onChange={e => setRestockForm({ ...restockForm, notes: e.target.value })} placeholder="e.g. Delivery from supplier" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={handleRestockSubmit}
                    disabled={restocking || !restockForm.quantity || Number(restockForm.quantity) <= 0}>
                    {restocking ? 'Restocking...' : 'Confirm Restock'}
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => setShowRestockModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'export' && (
        <div className="admin-card"><h3 className="admin-card-title">Export Participants</h3><p style={{ color: 'var(--admin-text-muted)', marginBottom: 20 }}>Download participant data.</p><div style={{ display: 'flex', gap: 12 }}><button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={() => handleExport('json')} disabled={exporting}>{exporting ? 'Exporting...' : 'Export JSON'}</button><button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => handleExport('csv')} disabled={exporting}>{exporting ? 'Exporting...' : 'Export CSV'}</button></div></div>
      )}
    </div>
  );
}