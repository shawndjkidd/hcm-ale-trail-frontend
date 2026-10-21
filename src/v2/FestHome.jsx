import { Sheet } from './ui';
import { artAt } from './fest';
import { festT } from './FestList';

// Collab Fest on the home screen: the side quest card (until the morning after the fest)
// and a one-time pop-up on the day.
const H = {
  en: {
    eyebrow: 'SIDE QUEST · JUST FOR FUN', title: 'Collab Fest', title2: 'beer list', tonight: 'TONIGHT',
    blurb: '{n} collab beers at BigBamBoo. Tick off each one you try and rate it.', triedLabel: "YOU'VE TRIED", open: 'Open my list',
    popEb: 'TONIGHT AT BIGBAMBOO', popA: 'How many of the', popB: '{n} collabs', popC: 'can you try?',
    popBody: "Tick off every collab beer you have tonight and give it a rating. No staff, no codes. It's your own list, just for fun.",
    start: 'Start my beer list', later: 'Maybe later',
  },
  vn: {
    eyebrow: 'NHIỆM VỤ PHỤ · CHO VUI', title: 'Collab Fest', title2: 'danh sách bia', tonight: 'TỐI NAY',
    blurb: '{n} bia collab tại BigBamBoo. Đánh dấu và chấm điểm mỗi loại bạn thử.', triedLabel: 'BẠN ĐÃ THỬ', open: 'Mở danh sách',
    popEb: 'TỐI NAY TẠI BIGBAMBOO', popA: 'Bạn thử được', popB: 'bao nhiêu trong {n}', popC: 'bia collab?',
    popBody: 'Đánh dấu mỗi loại bia collab bạn uống tối nay và chấm điểm. Không cần nhân viên, không cần mã. Danh sách của riêng bạn, cho vui.',
    start: 'Bắt đầu danh sách', later: 'Để sau',
  },
};
const ht = (l) => H[l] || H.en;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

export function FestCard({ fest, language, tonight, onOpen }) {
  const t = ht(language);
  const beers = fest.beers || [];
  const tried = Object.keys(fest.tastings).filter((k) => beers.some((b) => b.key === k)).length;
  const shown = beers.slice(0, 4);
  return (
    <section className="fl-card" aria-label={`${t.title} ${t.title2}`}>
      {tonight && <span className="rib">{t.tonight}</span>}
      <div className="in">
        <div className="fl-eb">{t.eyebrow}</div>
        <h3>{t.title}<br /><span>{t.title2}</span></h3>
        <p>{fill(t.blurb, { n: beers.length })}</p>
      </div>
      <div className="strip">
        {shown.map((b) => (artAt(b, 256) ? <img key={b.key} src={artAt(b, 256)} alt="" loading="lazy" /> : null))}
        {beers.length > shown.length && <span className="more">+{beers.length - shown.length}</span>}
      </div>
      <div className="foot">
        <div className="n"><small>{t.triedLabel}</small><b>{tried} <span>/ {beers.length}</span></b></div>
        <button type="button" className="go" onClick={onOpen}>{t.open}</button>
      </div>
    </section>
  );
}

export function FestPopup({ fest, language, onStart, onClose }) {
  const t = ht(language);
  const beers = fest.beers || [];
  const fan = [beers[5], beers[4], beers[8]].filter(Boolean).length === 3 ? [beers[5], beers[4], beers[8]] : beers.slice(0, 3);
  return (
    <Sheet onClose={onClose} label={festT(language).eyebrow}>
      <div className="fl-pop">
        <div className="fan">{fan.map((b) => (artAt(b, 256) ? <img key={b.key} src={artAt(b, 256)} alt="" /> : null))}</div>
        <div className="fl-eb">{t.popEb}</div>
        <h2>{t.popA}<br /><span>{fill(t.popB, { n: beers.length })}</span> {t.popC}</h2>
        <p>{t.popBody}</p>
        <div className="acts">
          <button type="button" className="fl-btn gold" onClick={onStart}>{t.start}</button>
          <button type="button" className="later" onClick={onClose}>{t.later}</button>
        </div>
      </div>
    </Sheet>
  );
}
