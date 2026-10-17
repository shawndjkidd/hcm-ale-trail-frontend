import { useEffect, useMemo } from 'react';
import { useT } from './i18n';

// Poster / picture for an event, in the create and edit forms (venue and HQ). The image
// is only sent once the event is saved: `value` is { url, file, removed } and the parent
// calls saveEventPoster() with it after the event exists. The previews show the two
// tight spots it's used in on the app: the event card (16:9, edges trimmed) and the
// round-cornered badge on the Tonight sign (a square from the centre).
export const emptyPoster = (url = null) => ({ url, file: null, removed: false });

export default function EventPosterField({ value, onChange }) {
  const t = useT();
  const preview = useMemo(() => (value.file ? URL.createObjectURL(value.file) : value.removed ? null : value.url), [value]);
  useEffect(() => () => { if (value.file && preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className="admin-form-group">
      <label className="admin-form-label">{t('Poster or picture')}</label>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '0 0 10px', lineHeight: 1.45 }}>
        {t('Best size: 1600 × 900 px, landscape (16:9). JPG or PNG.')}<br />
        {t('Keep words and logos near the middle: the app card trims the edges, and the Tonight sign shows a square from the centre. Tall posters work too, and show in full when someone opens the event.')}
      </p>
      {preview && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
          <figure style={{ margin: 0 }}>
            <div style={{ width: 240, aspectRatio: '16 / 9', borderRadius: 6, background: `#111 url("${preview}") center/cover`, border: '1px solid var(--admin-border)' }} />
            <figcaption style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>{t('Event card in the app')}</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            <div style={{ width: 58, height: 58, borderRadius: 10, background: `#111 url("${preview}") center/cover`, border: '3px solid #FFD100' }} />
            <figcaption style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>{t('Tonight sign')}</figcaption>
          </figure>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="admin-btn admin-btn-small admin-btn-primary" style={{ cursor: 'pointer', margin: 0 }}>
          {preview ? t('Change image') : t('Upload image')}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onChange({ ...value, file, removed: false }); }} />
        </label>
        {preview && (
          <button type="button" className="admin-btn-small" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }}
            onClick={() => onChange({ ...value, file: null, removed: true })}>{t('Remove image')}</button>
        )}
        {!preview && <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>{t('No image: the app shows your venue photo instead.')}</span>}
      </div>
    </div>
  );
}
