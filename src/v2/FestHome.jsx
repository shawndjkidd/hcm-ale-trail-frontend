import { Sheet } from './ui';
import { artAt, festLive, FEST_POSTER } from './fest';
import { festT } from './FestList';

// Collab Fest on the home screen: the side quest card (until the morning after the fest)
// and a one-time pop-up on the day.
const H = {
  en: {
    oneDay: 'ONE DAY ONLY', when: 'SAT 31 OCT · 4PM – MIDNIGHT · BIGBAMBOO', tonightOnly: 'TONIGHT ONLY · 4PM – MIDNIGHT · BIGBAMBOO',
    blurbSoon: '{n} collab beers, poured for one night only. Look through them now; tick them off and rate them on the night.', collabsLabel: 'COLLAB BEERS', preview: 'See the beers',
    eyebrow: 'COLLAB BEER LIST · JUST FOR FUN', title: 'Halloween Party', title2: 'side quest', tonight: 'TONIGHT',
    blurb: '{n} collab beers at BigBamBoo. Tick off each one you try and rate it.', triedLabel: "YOU'VE TRIED", open: 'Open my list',
    popEb: 'TONIGHT AT BIGBAMBOO', popA: 'How many of the', popB: '{n} collabs', popC: 'can you try?',
    popBody: "Tick off every collab beer you have tonight and give it a rating. No staff, no codes. It's your own list, just for fun.",
    start: 'Start my beer list', later: 'Maybe later',
  },
  vn: {
    oneDay: 'CHỈ MỘT NGÀY', when: 'T7 31/10 · 16:00 – NỬA ĐÊM · BIGBAMBOO', tonightOnly: 'CHỈ TỐI NAY · 16:00 – NỬA ĐÊM · BIGBAMBOO',
    blurbSoon: '{n} bia collab, chỉ rót trong một đêm. Xem trước ngay bây giờ; đánh dấu và chấm điểm vào đêm diễn ra.', collabsLabel: 'BIA COLLAB', preview: 'Xem các loại bia',
    eyebrow: 'DANH SÁCH BIA COLLAB · CHO VUI', title: 'Tiệc Halloween', title2: 'nhiệm vụ phụ', tonight: 'TỐI NAY',
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
  const live = festLive();
  return (
    <section className="fl-card hw" aria-label={`${t.title} ${t.title2}`}>
      <img className="poster" src={FEST_POSTER} alt="Halloween Party: Craft Beer Collab Festival, Saturday 31 October, 4pm to midnight, BigBamBoo" />
      <div className="oneday" role="note">
        <b>{t.oneDay}</b>
        <span>{tonight ? t.tonightOnly : t.when}</span>
      </div>
      <div className="in">
        <div className="fl-eb">{t.eyebrow}</div>
        <h3>{t.title}<br /><span>{t.title2}</span></h3>
        <p>{fill(live ? t.blurb : t.blurbSoon, { n: beers.length })}</p>
      </div>
      <div className="foot">
        <div className="n"><small>{live ? t.triedLabel : t.collabsLabel}</small><b>{live ? <>{tried} <span>/ {beers.length}</span></> : beers.length}</b></div>
        <button type="button" className="go" onClick={onOpen}>{live ? t.open : t.preview}</button>
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
